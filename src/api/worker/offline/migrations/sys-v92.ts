import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements, removeValue } from "../StandardMigrations.js"
import { CustomerTypeRef, GroupTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys92: OfflineMigration = {
	app: "sys",
	version: 92,
	async migrate(storage: OfflineStorage) {
		// KeyPair was changed
		await deleteInstancesOfType(storage, GroupTypeRef)
	},
}
