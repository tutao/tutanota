import { LoggedInEvent, LoginController, PostLoginAction } from "../api/main/LoginController.js"
import { CalendarModel } from "../../calendar-app/calendar/model/CalendarModel.js"
import { CalendarEventTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { CUSTOM_MIN_ID } from "../api/common/utils/EntityUtils.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { ProgressTracker } from "../api/main/ProgressTracker.js"
import { promiseMap } from "@tutao/tutanota-utils"
import { NoopProgressMonitor } from "../api/common/utils/ProgressMonitor.js"
import { SessionType } from "../api/common/SessionType.js"
import { ExposedCacheStorage } from "../api/worker/rest/DefaultEntityRestCache.js"
import { OfflineStorageSettingsModel } from "./OfflineStorageSettingsModel"

export class CachePostLoginAction implements PostLoginAction {
	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly entityClient: EntityClient,
		private readonly progressTracker: ProgressTracker,
		private readonly cacheStorage: ExposedCacheStorage,
		private readonly logins: LoginController,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null, // null if no cleaning e.g in calendar
	) {}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		// we use an ephemeral cache for non-persistent sessions which doesn't
		// support or save calendar events, so it's pointless to preload them.
		if (loggedInEvent.sessionType !== SessionType.Persistent) return
		//
		// 3 work to load calendar info, 2 work to load short and long events
		const workPerCalendar = 3 + 2
		const totalWork = this.logins.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = await this.progressTracker.registerMonitor(totalWork)
		const progressMonitor = this.progressTracker.getMonitor(monitorHandle) ?? new NoopProgressMonitor()
		const calendarInfos = await this.calendarModel.getCalendarInfos()

		await promiseMap(calendarInfos.values(), async ({ groupRoot }) => {
			await Promise.all([
				this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents, CUSTOM_MIN_ID).then(() => progressMonitor.workDone(1)),
				this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents, CUSTOM_MIN_ID).then(() => progressMonitor.workDone(1)),
			])
		})
		progressMonitor.completed()
	}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent && this.offlineStorageSettings != null) {
			await this.offlineStorageSettings.init()

			// Clear the excluded data (i.e. trash and spam lists, old data) in the offline storage.
			await this.cacheStorage.clearExcludedData(this.offlineStorageSettings.getTimeRange())
		}
	}
}
