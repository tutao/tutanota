import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage"
import Id from "../../../mail-app/translations/id"
import { ProgrammingError } from "@tutao/app-env"

export class DriveOfflineCleanerStub implements OfflineStorageCleaner {
	cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		throw new ProgrammingError("not implemented")
	}
}
