import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { CustomerInfoTypeRef } from "../../../entities/sys/TypeRefs"

export const sys119: OfflineMigration = {
	app: "sys",
	version: 119,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, CustomerInfoTypeRef)
	},
}
