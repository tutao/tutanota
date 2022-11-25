import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {migrateAllElements} from "../StandardMigrations.js"
import {createMailboxGroupRoot, createMailboxProperties, MailboxGroupRootTypeRef, MailboxPropertiesTypeRef} from "../../../entities/tutanota/TypeRefs.js"

export const tutanota56: OfflineMigration = {
	app: "tutanota",
	version: 56,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailboxPropertiesTypeRef, storage, [
			createMailboxProperties
		])
	}
}
