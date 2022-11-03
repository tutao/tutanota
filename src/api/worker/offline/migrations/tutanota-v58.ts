import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations.js"
import { createMail, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota58: OfflineMigration = {
	app: "tutanota",
	version: 58,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(MailTypeRef, storage, [createMail])
	},
}
