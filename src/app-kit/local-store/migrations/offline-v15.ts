import { OfflineMigration } from "../OfflineMigration"
import { OfflineStorage } from "../OfflineStorage"
import { MailSetEntryTypeRef } from "@tutao/entities/tutanota"

const VERSION = 15

/**
 * removes offline ranges for MailSetEntries because of cache inconsistencies
 */
export class offline15 extends OfflineMigration {
	constructor() {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage) {
		await storage.deleteAllRangesOfType(MailSetEntryTypeRef)
	}
}
