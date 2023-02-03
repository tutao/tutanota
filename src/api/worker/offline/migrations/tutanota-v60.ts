import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements } from "../StandardMigrations.js"
import { createMailBox, MailBoxTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota60: OfflineMigration = {
	app: "tutanota",
	version: 60,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailBoxTypeRef, storage, [createMailBox])
	},
}
