import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { MailSetEntryTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota84: OfflineMigration = {
	app: "tutanota",
	version: 84,
	async migrate(storage: OfflineStorage) {
		// Ranges for MailSetEntry were not updated correctly. Drop all ranges to force re-download.
		// see 6143c4336bf20c665e6535b4cb1f293f148eda5b
		// see https://github.com/tutao/tutanota/issues/8603
		// note: the users won't have their folder contents in offline db afterwards unless they open them
		await storage.deleteAllRangesOfType(MailSetEntryTypeRef)
	},
}
