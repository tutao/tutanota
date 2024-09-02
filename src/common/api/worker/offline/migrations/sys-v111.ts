import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { GroupKeyTypeRef, GroupTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys111: OfflineMigration = {
	app: "sys",
	version: 111,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(GroupTypeRef, storage, [removeValue("pubAdminGroupEncGKey"), addValue("pubAdminGroupEncGKey", null)])
		await migrateAllListElements(GroupKeyTypeRef, storage, [removeValue("pubAdminGroupEncGKey"), addValue("pubAdminGroupEncGKey", null)])
	},
}
