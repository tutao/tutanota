import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { ContactTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota67: OfflineMigration = {
	app: "tutanota",
	version: 67,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, ContactTypeRef)
	},
}
