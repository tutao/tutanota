import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { FileTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const sys88: OfflineMigration = {
	app: "sys",
	version: 88,
	async migrate(storage: OfflineStorage) {
		// Delete File instances to ensure that only File instances with references to Blobs exist
		await deleteInstancesOfType(storage, FileTypeRef)
	},
}
