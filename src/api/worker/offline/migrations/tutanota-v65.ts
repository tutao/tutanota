import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { FileTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota65: OfflineMigration = {
	app: "tutanota",
	version: 65,
	async migrate(storage: OfflineStorage) {
		// don't need to migrate InternalGroupData as it is never stored in the offline db
	},
}
