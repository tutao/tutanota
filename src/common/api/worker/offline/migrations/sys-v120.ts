import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys120: OfflineMigration = {
	app: "sys",
	version: 120,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(GroupInfoTypeRef, storage, [removeValue("localAdmin")])
		await migrateAllElements(GroupTypeRef, storage, [removeValue("administratedGroups")])
	},
}
