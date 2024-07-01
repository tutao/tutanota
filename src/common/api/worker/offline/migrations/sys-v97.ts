import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"
import { migrateAllElements, removeValue } from "../StandardMigrations.js"

export const sys97: OfflineMigration = {
	app: "sys",
	version: 97,
	async migrate(storage: OfflineStorage) {
		// As of 2020 the canceledPremiumAccount boolean value has always been set to
		// false therefore this value is no longer needed, and we can remove it.
		await migrateAllElements(CustomerTypeRef, storage, [removeValue("canceledPremiumAccount")])
	},
}
