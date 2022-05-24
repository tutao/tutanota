import {IPostLoginAction, LoggedInEvent, LoginController} from "../api/main/LoginController.js"
import {CalendarModel} from "../calendar/model/CalendarModel.js"
import {CalendarEventTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {CUSTOM_MIN_ID} from "../api/common/utils/EntityUtils.js"
import {EntityClient} from "../api/common/EntityClient.js"
import {DesktopConfigKey} from "../desktop/config/ConfigKeys.js"
import {NativeSystemApp} from "../native/common/NativeSystemApp.js"
import {ProgressTracker} from "../api/main/ProgressTracker.js"


export class CachePostLoginAction implements IPostLoginAction {

	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly entityClient: EntityClient,
		private readonly progressTracker: ProgressTracker,
		private readonly logins: LoginController,
		private readonly systemApp: NativeSystemApp | null
	) {

	}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		if (await this.systemApp?.getConfigValue(DesktopConfigKey.offlineStorageEnabled)) {
			// 3 work to load calendar info, 2 work to load short and long events
			const workPerCalendar = 3 + 2
			const totalWork = this.logins.getUserController().getCalendarMemberships().length * workPerCalendar
			const monitorHandle = this.progressTracker.registerMonitor(totalWork)
			const progressMonitor = this.progressTracker.getMonitor(monitorHandle)
			const calendarInfos = await this.calendarModel.loadCalendarInfos(progressMonitor!)
			const loadingPromises = []
			for (const {groupRoot} of calendarInfos.values()) {
				loadingPromises.push(this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents, CUSTOM_MIN_ID).then(() => progressMonitor?.workDone(1)))
				loadingPromises.push(this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents, CUSTOM_MIN_ID).then(() => progressMonitor?.workDone(1)))
			}
			await Promise.all(loadingPromises)
			progressMonitor?.completed()
		}
	}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		return Promise.resolve()
	}
}