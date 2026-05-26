import { lazyAsync, noOp } from "@tutao/utils"
import { CalendarModel } from "../model/CalendarModel"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { CalendarEventUpdateCoordinator } from "../model/CalendarEventUpdateCoordinator"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"
import { PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction"
import { remindActiveOutOfOfficeNotification } from "../../../common/misc/OutOfOfficeNotificationUtils"
import { isApp, isDesktop } from "@tutao/app-env"
import { showSnackBar } from "../../../../ui/base/SnackBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"


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
