/**
 * This file contains the functions used to set up and tear down edit dialogs for calendar events.
 *
 * they're not responsible for upholding invariants or ensure valid events (CalendarEventModel.editModels
 * and CalendarEventEditView do that), but know what additional information to ask the user before saving
 * and which methods to call to save the changes.
 */

import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { ButtonAttrs, ButtonType } from "../../../../common/gui/base/Button.js"
import { Keys } from "../../../../common/api/common/TutanotaConstants.js"
import { AlarmInterval, getTimeFormatForUser, parseAlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { assertNotNull, noOp, Thunk } from "@tutao/tutanota-utils"
import { PosRect } from "../../../../common/gui/base/Dropdown.js"
import type { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { CalendarEventEditView, EditorPages } from "./CalendarEventEditView.js"
import { askIfShouldSendCalendarUpdatesToAttendees } from "../CalendarGuiUtils.js"
import { CalendarEventIdentity, CalendarEventModel, EventSaveResult } from "../eventeditor-model/CalendarEventModel.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { UpgradeRequiredError } from "../../../../common/api/main/UpgradeRequiredError.js"
import { showPlanUpgradeRequiredDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { convertTextToHtml } from "../../../../common/misc/Formatter.js"
import { UserError } from "../../../../common/api/main/UserError.js"
import { showUserError } from "../../../../common/misc/ErrorHandlerImpl.js"
import { theme } from "../../../../common/gui/theme.js"
import stream from "mithril/stream"
import { getStartOfTheWeekOffsetForUser } from "../../../../common/misc/weekOffset"
import { newPromise } from "@tutao/tutanota-utils"

const enum ConfirmationResult {
	Cancel,
	Continue,
}

type EditDialogOkHandler = (posRect: PosRect, finish: Thunk) => Promise<unknown>

export class EventEditorDialog {
	private currentPage: stream<EditorPages> = stream(EditorPages.MAIN)
	private dialog: Dialog | null = null
	private headerDom: HTMLElement | null = null

	constructor() {}

	private left(): ButtonAttrs[] {
		if (this.currentPage() === EditorPages.MAIN) {
			return [
				{
					label: "cancel_action",
					click: () => this.dialog?.close(),
					type: ButtonType.Secondary,
				},
			]
		}

		return [
			{
				label: "back_action",
				click: () => this.currentPage(EditorPages.MAIN),
				type: ButtonType.Secondary,
			},
		]
	}

	private right(okAction: (dom: HTMLElement) => unknown): ButtonAttrs[] {
		if (this.currentPage() === EditorPages.MAIN) {
			return [
				{
					label: "save_action",
					click: (event: MouseEvent, dom: HTMLElement) => okAction(dom),
					type: ButtonType.Primary,
				},
			]
		}

		return []
	}

	/**
	 * the generic way to open any calendar edit dialog. the caller should know what to do after the
	 * dialog is closed.
	 */
	async showCalendarEventEditDialog(model: CalendarEventModel, handler: EditDialogOkHandler): Promise<void> {
		const recipientsSearch = await locator.recipientsSearchModel()
		const { HtmlEditor } = await import("../../../../common/gui/editor/HtmlEditor.js")
		const groupSettings = locator.logins.getUserController().userSettingsGroupRoot.groupSettings

		const groupColors: Map<Id, string> = groupSettings.reduce((acc, gc) => {
			acc.set(gc.group, gc.color)
			return acc
		}, new Map())

		const defaultAlarms: Map<Id, AlarmInterval[]> = groupSettings.reduce((acc, gc) => {
			acc.set(
				gc.group,
				gc.defaultAlarmsList.map((alarm) => parseAlarmInterval(alarm.trigger)),
			)
			return acc
		}, new Map())

		const descriptionText = convertTextToHtml(model.editModels.description.content)
		const descriptionEditor: HtmlEditor = new HtmlEditor()
			.setShowOutline(true)
			.setMinHeight(200)
			.setEnabled(true)
			// We only set it once, we don't viewModel on every change, that would be slow
			.setValue(descriptionText)

		const okAction = (dom: HTMLElement) => {
			descriptionEditor.editor.domElement?.blur()
			model.editModels.description.content = descriptionEditor.getTrimmedValue()
			handler(dom.getBoundingClientRect(), () => dialog.close())
		}

		const summary = model.editModels.summary.content
		const heading = summary.trim().length > 0 ? lang.makeTranslation("summary", summary) : "createEvent_label"

		const navigationCallback = (targetPage: EditorPages) => {
			this.currentPage(targetPage)
		}

		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: this.left.bind(this),
				middle: heading,
				right: this.right.bind(this, okAction),
				create: (dom) => {
					this.headerDom = dom
				},
			},
			CalendarEventEditView,
			{
				model,
				recipientsSearch,
				descriptionEditor,
				startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot),
				timeFormat: getTimeFormatForUser(locator.logins.getUserController().userSettingsGroupRoot),
				groupColors,
				defaultAlarms,
				navigationCallback,
				currentPage: this.currentPage,
			},
			{
				height: "100%",
				"background-color": theme.surface_container,
				color: theme.on_surface,
			},
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => dialog.close(),
				help: "close_alt",
			})
			.addShortcut({
				key: Keys.S,
				ctrlOrCmd: true,
				exec: () => okAction(assertNotNull(this.headerDom, "headerDom was null")),
				help: "save_action",
			})

		if (client.isMobileDevice()) {
			// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
			dialog.setFocusOnLoadFunction(noOp)
		}

		this.dialog = dialog

		dialog.show()
	}

	/**
	 * show an edit dialog for an event that does not exist on the server yet (or anywhere else)
	 *
	 * will unconditionally send invites on save.
	 * @param model the calendar event model used to edit and save the event
	 * @param okActionCallback - High level callback fired when the operation is successfully executed/saved
	 */
	async showNewCalendarEventEditDialog(model: CalendarEventModel, okActionCallback?: Thunk): Promise<void> {
		let finished = false // Avoid async callbacks being called multiple times

		const okAction: EditDialogOkHandler = async (posRect, finish) => {
			/** new event, so we always want to send invites. */
			model.editModels.whoModel.shouldSendUpdates = true
			if (finished) {
				return
			}

			try {
				const result = await model.apply()
				if (result === EventSaveResult.Saved) {
					finished = true
					await okActionCallback?.()
					finish()
					const { handleRatingByEvent } = await import("../../../../common/ratings/UserSatisfactionDialog.js")
					void handleRatingByEvent("Calendar")
				}
			} catch (e) {
				if (e instanceof UserError) {
					// noinspection ES6MissingAwait
					showUserError(e)
				} else if (e instanceof UpgradeRequiredError) {
					await showPlanUpgradeRequiredDialog(e.plans)
				} else {
					throw e
				}
			}
		}

		return this.showCalendarEventEditDialog(model, okAction)
	}

	/**
	 * show a dialog that allows to edit a calendar event that already exists.
	 *
	 * on save, will validate external passwords, account type and user intent before actually saving and sending updates/invites/cancellations.
	 *
	 * @param model the calendar event model used to edit & save the event
	 * @param identity the identity of the event to edit
	 * @param responseMail a mail containing an invite and/or update for this event in case we need to reply to the organizer
	 */
	async showExistingCalendarEventEditDialog(model: CalendarEventModel, identity: CalendarEventIdentity): Promise<void> {
		let finished = false

		if (identity.uid == null) {
			throw new ProgrammingError("tried to edit existing event without uid, this is impossible for certain edit operations.")
		}

		return newPromise((resolve, reject) => {
			const okAction: EditDialogOkHandler = async (posRect, finish) => {
				if (finished || (await this.askUserIfUpdatesAreNeededOrCancel(model)) === ConfirmationResult.Cancel) {
					return
				}

				try {
					const result = await model.apply()
					if (result === EventSaveResult.Saved || result === EventSaveResult.NotFound) {
						finished = true
						finish()

						// Inform the user that the event was deleted, avoiding misunderstanding that the event was saved
						if (result === EventSaveResult.NotFound) Dialog.message("eventNoLongerExists_msg")
					}

					resolve()
				} catch (e) {
					if (e instanceof UserError) {
						// noinspection ES6MissingAwait
						showUserError(e)
					} else if (e instanceof UpgradeRequiredError) {
						await showPlanUpgradeRequiredDialog(e.plans)
					} else {
						throw e
					}

					reject()
				}
			}

			this.showCalendarEventEditDialog(model, okAction)
		})
	}

	/** if there are update worthy changes on the model, ask the user what to do with them.
	 * @returns {ConfirmationResult} Cancel if the whole process should be cancelled, Continue if the user selected whether to send updates and the saving
	 * should proceed.
	 * */
	async askUserIfUpdatesAreNeededOrCancel(model: CalendarEventModel): Promise<ConfirmationResult> {
		if (model.isAskingForUpdatesNeeded()) {
			switch (await askIfShouldSendCalendarUpdatesToAttendees()) {
				case "yes":
					model.editModels.whoModel.shouldSendUpdates = true
					break
				case "no":
					break
				case "cancel":
					console.log("not saving event: user cancelled update sending.")
					return ConfirmationResult.Cancel
			}
		}

		return ConfirmationResult.Continue
	}
}
