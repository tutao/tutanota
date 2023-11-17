import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"
import { MailboxGroupRootTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota65: OfflineMigration = {
	app: "tutanota",
	version: 65,
	async migrate(storage: OfflineStorage) {
		migrateAllListElements(MailTypeRef, storage, [removeValue("restrictions")])
		migrateAllElements(MailboxGroupRootTypeRef, storage, [
			removeValue("contactFormUserContactForm"),
			removeValue("targetMailGroupContactForm"),
			removeValue("participatingContactForms"),
		])
	},
}
