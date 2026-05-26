import { remindActiveOutOfOfficeNotification } from "../../misc/OutOfOfficeNotificationUtils"
import { isApp, isDesktop } from "@tutao/app-env"
import { PostLoginAction } from "../../api/main/LoginController"
import { CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { EntityClient } from "../../api/common/EntityClient"
import { lazyAsync, noOp } from "@tutao/utils"
import { CalendarEventUpdateCoordinator } from "../../../calendar-app/calendar/model/CalendarEventUpdateCoordinator"
import { SyncDonePriority, SyncTracker } from "../../api/main/SyncTracker"
import { showSnackBar } from "../../gui/base/SnackBar"
import { lang } from "../../misc/LanguageViewModel"

export async function setupCalendarModels(
	lazyCalendarModel: lazyAsync<CalendarModel>,
	entityClient: EntityClient,
	lazyCalendarEventUpdateCoordinator: lazyAsync<CalendarEventUpdateCoordinator>,
	syncTracker: SyncTracker,
): Promise<PostLoginAction> {
	return {
		async onPartialLoginSuccess() {},
		async onFullLoginSuccess() {
			lazyCalendarModel().then((calendarModel) => {
				calendarModel.init()

				lazyCalendarEventUpdateCoordinator().then((calendarEventUpdateCoordinator) => calendarEventUpdateCoordinator.init())
				remindActiveOutOfOfficeNotification(entityClient)

				if (isApp() || isDesktop()) {
					handleExternalSync(calendarModel, syncTracker)
				}
			})
		},
	}
}

function handleExternalSync(calendarModel: CalendarModel, syncTracker: SyncTracker) {
	if (isApp() || isDesktop()) {
		syncTracker.addSyncDoneListener({
			onSyncDone: async () => {
				calendarModel.syncExternalCalendars().catch(async (e) => {
					showSnackBar({
						message: lang.makeTranslation("exception_msg", e.message),
						button: {
							label: "ok_action",
							click: noOp,
						},
						waitingTime: 1000,
					})
				})
				calendarModel.scheduleExternalCalendarSync()
			},
			priority: SyncDonePriority.HIGH,
		})
	}
}
