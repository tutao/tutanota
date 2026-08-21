import { LoginController } from "../api/main/LoginController.js"
import { CalendarModel } from "../../calendar-app/calendar/model/CalendarModel.js"
import { EntityClient } from "../../../platform-kit/network/EntityClient.js"
import { ProgressTracker } from "../api/main/ProgressTracker.js"
import { promiseMap } from "../../../platform-kit/utils"
import { SessionType } from "../../../platform-kit/app-env"
import { SyncTracker } from "../api/main/SyncTracker"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction.js"
import { NoopProgressMonitor } from "../../../platform-kit/network/ProgressMonitorInterface"
import { CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { CacheSyncStatus, ListenerPriority } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export class CalendarPostLoginAction implements PostLoginAction {
	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly entityClient: EntityClient,
		private readonly progressTracker: ProgressTracker,
		private readonly logins: LoginController,
		private readonly syncTracker: SyncTracker,
	) {}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		// we use an ephemeral cache for non-persistent sessions which doesn't
		// support or save calendar events, so it's pointless to preload them.
		if (loggedInEvent.sessionType !== SessionType.Persistent) return

		// we preload all calendar events once to ensure that the calendar
		// can be accessed offline on desktop and mobile
		this.syncTracker.addSyncListener({
			id: "CalendarPostLoginAction",
			onSyncStatusChange: async () => {
				// 3 work to load calendar info, 2 work to load short and long events
				const workPerCalendar = 3 + 2
				const totalWork = this.logins.getUserController().getCalendarMemberships().length * workPerCalendar
				const monitorHandle = await this.progressTracker.registerMonitor(totalWork)
				const progressMonitor = this.progressTracker.getMonitor(monitorHandle) ?? new NoopProgressMonitor()
				const calendarInfos = await this.calendarModel.getCalendarInfos()

				await promiseMap(calendarInfos.values(), async ({ groupRoot }) => {
					await Promise.all([
						this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents).then(() => progressMonitor.workDone(1)),
						this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then(() => progressMonitor.workDone(1)),
					])
				})
				progressMonitor.completed()
			},
			priority: ListenerPriority.HIGH,
			targetStatus: CacheSyncStatus.OnlineSyncDone,
		})
	}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		//no-op
	}
}
