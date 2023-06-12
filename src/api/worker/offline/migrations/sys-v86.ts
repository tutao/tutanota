import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { BookingTypeRef, CustomerInfoTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys86: OfflineMigration = {
	app: "sys",
	version: 86,
	async migrate(storage: OfflineStorage) {
		// delete stored CustomerInfo for new pricing model values and force client to retrieve a new one
		await deleteInstancesOfType(storage, CustomerInfoTypeRef)
		await deleteInstancesOfType(storage, GroupTypeRef)
		await deleteInstancesOfType(storage, BookingTypeRef)
		// We also delete GroupInfo and UserType ref to disable offline login. Otherwise clients will see an unexpected error message with pure offline login.
		await deleteInstancesOfType(storage, GroupInfoTypeRef)
		await deleteInstancesOfType(storage, UserTypeRef)
	},
}
