import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys117: OfflineMigration = {
	app: "sys",
	version: 117,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(GroupInfoTypeRef, storage, [removeValue("localAdmin")])
		await migrateAllElements(GroupTypeRef, storage, [removeValue("administratedGroups")])
	},
}
