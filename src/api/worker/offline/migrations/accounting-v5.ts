import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements } from "../StandardMigrations.js"
import { createMailBox, MailBoxTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const accounting5: OfflineMigration = {
	app: "accounting",
	version: 5,
	async migrate(storage: OfflineStorage) {
		// only changes to data transfer types
	},
}
