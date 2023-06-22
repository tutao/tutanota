import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { BookingTypeRef, CustomerInfoTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys88: OfflineMigration = {
	app: "sys",
	version: 88,
	async migrate(storage: OfflineStorage) {
		// dummy
	},
}
