import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage.js"

export class CalendarOfflineCleaner implements OfflineStorageCleaner {
	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDays: number | null, userId: Id, now: number): Promise<void> {
		// nothing needs to specifically be done for Calendar right now,
		// but we need to have this to complement the mail one.
	}
}
