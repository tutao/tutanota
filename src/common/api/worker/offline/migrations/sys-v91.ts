import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, removeValue } from "../StandardMigrations.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys91: OfflineMigration = {
	app: "sys",
	version: 91,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(CustomerTypeRef, storage, [removeValue("contactFormUserGroups"), removeValue("contactFormUserAreaGroups")])
	},
}
