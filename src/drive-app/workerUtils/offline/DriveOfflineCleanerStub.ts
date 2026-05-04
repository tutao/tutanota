import { ProgrammingError } from "@tutao/app-env"
import { OfflineStorage, OfflineStorageCleaner } from "../../../local-store/OfflineStorage"

export class DriveOfflineCleanerStub implements OfflineStorageCleaner {
	cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		throw new ProgrammingError("not implemented")
	}
}
