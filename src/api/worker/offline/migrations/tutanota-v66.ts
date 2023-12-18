import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"
import { MailboxGroupRootTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota66: OfflineMigration = {
	app: "tutanota",
	version: 66,
	async migrate(storage: OfflineStorage) {
		// don't need to migrate InternalGroupData as it is never stored in the offline db
	},
}
