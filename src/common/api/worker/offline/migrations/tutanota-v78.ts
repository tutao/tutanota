import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, deleteInstancesOfType, migrateAllListElements, removeValue } from "../StandardMigrations"
import { MailFolderTypeRef, TutanotaPropertiesTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota78: OfflineMigration = {
	app: "tutanota",
	version: 78,
	async migrate(storage: OfflineStorage) {},
}
