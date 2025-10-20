import { Router } from "../../../common/gui/ScopedRouter"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { QuickAction } from "../../../common/misc/QuickActionBar"
import { lang } from "../../../common/misc/LanguageViewModel"
import { CalendarOperation } from "../gui/eventeditor-model/CalendarEventModel"
import { CALENDAR_PREFIX } from "../../../common/misc/RouteChange"
import { locator } from "../../../common/api/main/CommonLocator"
import { getEventWithDefaultTimes } from "../../../common/api/common/utils/CommonCalendarUtils"
import { EventEditorDialog } from "../gui/eventeditor-view/CalendarEventEditDialog"
import { LoginController } from "../../../common/api/main/LoginController"
import { CalendarModel } from "../model/CalendarModel"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { type CalendarProperties, showCreateEditCalendarDialog } from "../gui/EditCalendarDialog"
import { CalendarType } from "../../../common/calendar/date/CalendarUtils"
import { Dialog } from "../../../common/gui/base/Dialog"

export async function quickCalendarActions(
	router: Router,
	mailboxModel: MailboxModel,
	calendarModel: CalendarModel,
	logins: LoginController,
): Promise<readonly QuickAction[]> {
	const newEventAction: QuickAction = {
		description: lang.getTranslationText("newEvent_action"),
		exec: async () => {
			const mailboxDetails = await mailboxModel.getUserMailboxDetails()
			const mailboxProperties = await mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
			const eventModel = await locator.calendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(), mailboxDetails, mailboxProperties, null)
			if (eventModel) {
				const eventEditor = new EventEditorDialog()
				await eventEditor.showNewCalendarEventEditDialog(eventModel)
			}
		},
	}

	const newCalendarAction: QuickAction = {
		description: lang.getTranslationText("addCalendar_action"),
		exec: () => {
			const userController = logins.getUserController()
			if (userController.isFreeAccount()) {
				showNotAvailableForFreeDialog()
			} else {
				showCreateEditCalendarDialog({
					calendarType: CalendarType.NORMAL,
					titleTextId: "add_action",
					okAction: async (dialog: Dialog, properties: CalendarProperties) => {
						await calendarModel.createCalendar(properties.nameData.name, properties.color, properties.alarms, null)
						dialog.close()
					},
					okTextId: "save_action",
					calendarModel,
				})
			}
		},
	}

	const calendarTabAction: QuickAction = {
		description: lang.get("calendar_label"),
		exec: () => router.routeTo(CALENDAR_PREFIX, {}),
	}

	return [calendarTabAction, newEventAction, newCalendarAction]
}
