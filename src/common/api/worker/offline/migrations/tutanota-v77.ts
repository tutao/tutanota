import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, deleteInstancesOfType, migrateAllListElements, removeValue } from "../StandardMigrations"
import { MailFolderTypeRef, TutanotaPropertiesTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota77: OfflineMigration = {
	app: "tutanota",
	version: 77,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(MailFolderTypeRef, storage, [removeValue("isLabel"), addValue("color", null)])
		await deleteInstancesOfType(storage, TutanotaPropertiesTypeRef)
	},
}
