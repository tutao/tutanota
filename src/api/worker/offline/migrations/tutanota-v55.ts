import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {migrateAllElements} from "../StandardMigrations.js"
import {createMailboxGroupRoot, MailboxGroupRootTypeRef} from "../../../entities/tutanota/TypeRefs.js"

export const tutanota55: OfflineMigration = {
	app: "tutanota",
	version: 55,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailboxGroupRootTypeRef, storage, [
			createMailboxGroupRoot
		])
	}
}
