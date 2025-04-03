import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, migrateAllElements } from "../StandardMigrations"
import { GroupTypeRef } from "../../../entities/sys/TypeRefs"

export const sys127: OfflineMigration = {
	app: "sys",
	version: 127,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(GroupTypeRef, storage, [addValue("identityKeyPair", null)])
	},
}
