import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { FileTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota64: OfflineMigration = {
	app: "tutanota",
	version: 64,
	async migrate(storage: OfflineStorage) {
		// We have fully removed FileData
		migrateAllListElements(FileTypeRef, storage, [removeValue("data")])
	},
}
