import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements, removeValue } from "../StandardMigrations"
import { MailFolderTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota83: OfflineMigration = {
	app: "tutanota",
	version: 83,
	async migrate(storage: OfflineStorage) {},
}
