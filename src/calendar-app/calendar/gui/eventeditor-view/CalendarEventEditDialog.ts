/**
 * This file contains the functions used to set up and tear down edit dialogs for calendar events.
 *
 * they're not responsible for upholding invariants or ensure valid events (CalendarEventModel.editModels
 * and CalendarEventEditView do that), but know what additional information to ask the user before saving
 * and which methods to call to save the changes.
 */

import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { ButtonType } from "../../../../common/gui/base/Button.js"
import { Keys } from "../../../../common/api/common/TutanotaConstants.js"
import { AlarmInterval, getStartOfTheWeekOffsetForUser, getTimeFormatForUser, parseAlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import type { DialogHeaderBarAttrs } from "../../../../common/gui/base/DialogHeaderBar.js"
import { assertNotNull, noOp, Thunk } from "@tutao/tutanota-utils"
import { PosRect } from "../../../../common/gui/base/Dropdown.js"
import { Mail } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import type { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { CalendarEventEditView } from "./CalendarEventEditView.js"
import { askIfShouldSendCalendarUpdatesToAttendees } from "../CalendarGuiUtils.js"
import { CalendarEventIdentity, CalendarEventModel, EventSaveResult } from "../eventeditor-model/CalendarEventModel.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { UpgradeRequiredError } from "../../../../common/api/main/UpgradeRequiredError.js"
import { showPlanUpgradeRequiredDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { convertTextToHtml } from "../../../../common/misc/Formatter.js"
import { UserError } from "../../../../common/api/main/UserError.js"
import { showUserError } from "../../../../common/misc/ErrorHandlerImpl.js"

const enum ConfirmationResult {
	Cancel,
	Continue,
}

type EditDialogOkHandler = (posRect: PosRect, finish: Thunk) => Promise<unknown>

/**
 * the generic way to open any calendar edit dialog. the caller should know what to do after the
 * dialog is closed.
 */
async function showCalendarEventEditDialog(model: CalendarEventModel, responseMail: Mail | null, handler: EditDialogOkHandler): Promise<void> {
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
	const descriptionEditor: HtmlEditor = new HtmlEditor("description_label")
		.setMinHeight(400)
		.showBorders()
		.setEnabled(true)
		// We only set it once, we don't viewModel on every change, that would be slow
		.setValue(descriptionText)
		.setToolbarOptions({
			alignmentEnabled: false,
			fontSizeEnabled: false,
		})
		.enableToolbar()

	const okAction = (dom: HTMLElement) => {
		model.editModels.description.content = descriptionEditor.getTrimmedValue()
		handler(dom.getBoundingClientRect(), () => dialog.close())
	}

	let headerDom: HTMLElement | null = null
	const heading = () => {
		const summary = model.editModels.summary.content
		return summary.trim().length > 0 ? summary : lang.get("createEvent_label")
	}
	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: () => dialog.close(),
				type: ButtonType.Secondary,
			},
		],
		middle: heading,
		right: [
			{
				label: "save_action",
				click: (event, dom) => okAction(dom),
				type: ButtonType.Primary,
			},
		],
		create: (dom) => {
			headerDom = dom
		},
	}

	const dialog: Dialog = Dialog.editDialog(dialogHeaderBarAttrs, CalendarEventEditView, {
		model,
		recipientsSearch,
		descriptionEditor,
		startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot),
		timeFormat: getTimeFormatForUser(locator.logins.getUserController().userSettingsGroupRoot),
		groupColors,
		defaultAlarms,
	})
		.addShortcut({
			key: Keys.ESC,
			exec: () => dialog.close(),
			help: "close_alt",
		})
		.addShortcut({
			key: Keys.S,
			ctrlOrCmd: true,
			exec: () => okAction(assertNotNull(headerDom, "headerDom was null")),
			help: "save_action",
		})

	if (client.isMobileDevice()) {
		// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
		dialog.setFocusOnLoadFunction(noOp)
	}

	dialog.show()
}

/**
 * show an edit dialog for an event that does not exist on the server yet (or anywhere else)
 *
 * will unconditionally send invites on save.
 * @param model the calendar event model used to edit and save the event
 */
export async function showNewCalendarEventEditDialog(model: CalendarEventModel): Promise<void> {
	let finished = false

	const okAction: EditDialogOkHandler = async (posRect, finish) => {
		/** new event, so we always want to send invites. */
		model.editModels.whoModel.shouldSendUpdates = true
		if (finished || (await askUserIfInsecurePasswordsAreOk(model)) === ConfirmationResult.Cancel) {
			return
		}

		try {
			const result = await model.apply()
			if (result === EventSaveResult.Saved) {
				finished = true
				finish()
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
	return showCalendarEventEditDialog(model, null, okAction)
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
export async function showExistingCalendarEventEditDialog(
	model: CalendarEventModel,
	identity: CalendarEventIdentity,
	responseMail: Mail | null = null,
): Promise<void> {
	let finished = false

	if (identity.uid == null) {
		throw new ProgrammingError("tried to edit existing event without uid, this is impossible for certain edit operations.")
	}

	const okAction: EditDialogOkHandler = async (posRect, finish) => {
		if (
			finished ||
			(await askUserIfUpdatesAreNeededOrCancel(model)) === ConfirmationResult.Cancel ||
			(await askUserIfInsecurePasswordsAreOk(model)) === ConfirmationResult.Cancel
		) {
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
	await showCalendarEventEditDialog(model, responseMail, okAction)
}

/** if there are update worthy changes on the model, ask the user what to do with them.
 * @returns {ConfirmationResult} Cancel if the whole process should be cancelled, Continue if the user selected whether to send updates and the saving
 * should proceed.
 * */
async function askUserIfUpdatesAreNeededOrCancel(model: CalendarEventModel): Promise<ConfirmationResult> {
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

/** if {@param model} is set to send updates but has insecure external passwords, ask the user what the action to resolve this should be.
 * @returns {ConfirmationResult} Cancel if the dialog should stay open, Continue if the save action should proceed despite insecure passwords. */
async function askUserIfInsecurePasswordsAreOk(model: CalendarEventModel): Promise<ConfirmationResult> {
	if (
		model.editModels.whoModel.shouldSendUpdates && // we want to send updates
		model.editModels.whoModel.hasInsecurePasswords() && // the model declares some of the passwords insecure
		!(await Dialog.confirm("presharedPasswordNotStrongEnough_msg")) // and the user is not OK with that
	) {
		console.log("not saving event: insecure passwords.")
		return ConfirmationResult.Cancel
	}

	return ConfirmationResult.Continue
}
