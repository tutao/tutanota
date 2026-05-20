import { ProgrammingError } from "../../../../platform-kit/app-env"
import { OfflineStorage, OfflineStorageCleaner } from "../../../../app-kit/local-store/OfflineStorage"

export class DriveOfflineCleanerStub implements OfflineStorageCleaner {
	cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		throw new ProgrammingError("not implemented")
	}
}
