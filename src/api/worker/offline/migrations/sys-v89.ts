import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { FileTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { CustomerInfoTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys89: OfflineMigration = {
	app: "sys",
	version: 89,
	async migrate(storage: OfflineStorage) {},
}
