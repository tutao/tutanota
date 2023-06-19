/**
 * This file contains the functions used to set up and tear down edit dialogs for calendar events.
 *
 * they're not responsible for upholding invariants or ensure valid events (CalendarEventModel.editModels
 * and CalendarEventEditView do that), but know what additional information to ask the user before saving
 * and which methods to call to save the changes.
 */

import { Dialog } from "../../../gui/base/Dialog.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { ButtonType } from "../../../gui/base/Button.js"
import { Keys } from "../../../api/common/TutanotaConstants.js"
import { getStartOfTheWeekOffsetForUser, getTimeFormatForUser } from "../../date/CalendarUtils.js"
import { client } from "../../../misc/ClientDetector.js"
import type { DialogHeaderBarAttrs } from "../../../gui/base/DialogHeaderBar.js"
import { assertNotNull, noOp, Thunk } from "@tutao/tutanota-utils"
import { PosRect } from "../../../gui/base/Dropdown.js"
import { Mail } from "../../../api/entities/tutanota/TypeRefs.js"
import type { HtmlEditor } from "../../../gui/editor/HtmlEditor.js"
import { locator } from "../../../api/main/MainLocator.js"
import { CalendarEventEditView } from "./CalendarEventEditView.js"
import { askIfShouldSendCalendarUpdatesToAttendees } from "../CalendarGuiUtils.js"
import { UserError } from "../../../api/main/UserError.js"
import { showPlanUpgradeRequiredDialog } from "../../../misc/SubscriptionDialogs.js"
import { showUserError } from "../../../misc/ErrorHandlerImpl.js"
import { CalendarEventIdentity, CalendarEventModel, EventSaveResult, EventType } from "../../date/eventeditor/CalendarEventModel.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { UpgradeRequiredError } from "../../../api/main/UpgradeRequiredError.js"

/**
 * which parts of a calendar event series to apply an edit operation to.
 * consumers must take care to only use appropriate values for the operation
 * in question (ie removing a repeat rule from a single event in a series is nonsensical)
 */
export const enum CalendarEventEditMode {
	/** only apply the edit to only one particular instance of the series */
	This,
	/** edit the whole series */
	All,
	/** apply the edit to every instance from the edited one out */
	ThisAndFuture,
	/** don't apply the edit at all */
	Cancel,
}

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
	const { HtmlEditor } = await import("../../../gui/editor/HtmlEditor.js")
	const groupColors: Map<Id, string> = locator.logins.getUserController().userSettingsGroupRoot.groupSettings.reduce((acc, gc) => {
		acc.set(gc.group, gc.color)
		return acc
	}, new Map())
	const descriptionEditor: HtmlEditor = new HtmlEditor("description_label")
		.setMinHeight(400)
		.showBorders()
		.setEnabled(true)
		// We only set it once, we don't viewModel on every change, that would be slow
		.setValue(model.editModels.description.content)
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
	})
		.addShortcut({
			key: Keys.ESC,
			exec: () => dialog.close(),
			help: "close_alt",
		})
		.addShortcut({
			key: Keys.S,
			ctrl: true,
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
		model.shouldSendUpdates = true
		if (finished || (await askUserIfInsecurePasswordsAreOk(model)) === ConfirmationResult.Cancel) {
			return
		}

		try {
			const result = await model.saveNewEvent()
			if (result === EventSaveResult.Saved) {
				finished = true
				finish()
			}
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				showUserError(e)
			} else if (e instanceof UpgradeRequiredError) {
				if (e.plans.length > 0) model.canUseInvites = await showPlanUpgradeRequiredDialog(e.plans)
				else {
					throw new ProgrammingError("no plans to upgrade to")
				}
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
			const result = await model.updateExistingEvent()
			if (result === EventSaveResult.Saved) {
				finished = true
				finish()
			}
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				showUserError(e)
			} else if (e instanceof UpgradeRequiredError) {
				if (e.plans.length > 0) model.canUseInvites = await showPlanUpgradeRequiredDialog(e.plans)
				else {
					throw new ProgrammingError("no plans to upgrade to")
				}
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
	if (
		model.eventType === EventType.OWN &&
		!model.shouldSendUpdates &&
		model.editModels.whoModel.initiallyHadOtherAttendees &&
		(await model.hasUpdateWorthyChanges())
	) {
		switch (await askIfShouldSendCalendarUpdatesToAttendees()) {
			case "yes":
				model.shouldSendUpdates = true
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
		model.shouldSendUpdates && // we want to send updates
		model.editModels.whoModel.hasInsecurePasswords() && // the model declares some of the passwords insecure
		!(await Dialog.confirm("presharedPasswordNotStrongEnough_msg")) // and the user is not OK with that
	) {
		console.log("not saving event: insecure passwords.")
		return ConfirmationResult.Cancel
	}

	return ConfirmationResult.Continue
}
