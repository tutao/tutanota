import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage.js"
import { Entity } from "../../../common/api/common/EntityTypes"
import { TypeRef } from "@tutao/tutanota-utils"

export class CalendarOfflineCleaner implements OfflineStorageCleaner {
	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		// nothing needs to specifically be done for Calendar right now,
		// but we need to have this to complement the mail one.
	}

	async getCutoffId<T extends Entity>(
		offlineStorage: OfflineStorage,
		typeRef: TypeRef<T>,
		timeRangeDate: Date | null,
		userId: Id,
		now: number,
	): Promise<Id | null> {
		// nothing needs to specifically be done for Calendar right now,
		// but we need to have this to complement the mail one.
		return null
	}
}
