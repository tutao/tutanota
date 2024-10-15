import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, removeValue } from "../StandardMigrations"
import { MailboxGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs"

export const sys112: OfflineMigration = {
	app: "sys",
	version: 112,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailboxGroupRootTypeRef, storage, [removeValue("whitelistedDomains")])
	},
}
