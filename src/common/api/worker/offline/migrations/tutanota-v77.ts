import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements } from "../StandardMigrations"
import { createMailBox, MailBoxTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota77: OfflineMigration = {
	app: "tutanota",
	version: 77,
	async migrate(storage: OfflineStorage) {
		// tutanotaV77 adds the ImportMailService and corresponding types
		// additionally the model adds the new value importedAttachments (GeneratedId) to the MailBox type
		await migrateAllElements(MailBoxTypeRef, storage, [createMailBox]) // initialize importedAttachments
	},
}
