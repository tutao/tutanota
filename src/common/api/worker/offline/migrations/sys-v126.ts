import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, migrateAllElements } from "../StandardMigrations"
import { GroupTypeRef } from "../../../entities/sys/TypeRefs"

export const sys126: OfflineMigration = {
	app: "sys",
	version: 126,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(GroupTypeRef, storage, [addValue("identityKeyPair", null)])
	},
}
