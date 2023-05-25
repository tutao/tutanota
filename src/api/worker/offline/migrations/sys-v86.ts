import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { CustomerInfoTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys86: OfflineMigration = {
	app: "sys",
	version: 86,
	async migrate(storage: OfflineStorage) {
		// delete stored CustomerInfo for new pricing model values and force client to retrieve a new one
		deleteInstancesOfType(storage, CustomerInfoTypeRef)
	},
}
