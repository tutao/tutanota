import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements, removeValue } from "../StandardMigrations"
import { MailboxGroupRootTypeRef, MailBoxTypeRef } from "../../../entities/tutanota/TypeRefs"
import { UserGroupRootTypeRef } from "../../../entities/sys/TypeRefs"

export const tutanota76: OfflineMigration = {
	app: "tutanota",
	version: 76,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailboxGroupRootTypeRef, storage, [removeValue("whitelistRequests")])
	},
}
