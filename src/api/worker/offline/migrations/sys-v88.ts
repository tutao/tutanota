import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { FileTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { CustomerInfoTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys88: OfflineMigration = {
	app: "sys",
	version: 88,
	async migrate(storage: OfflineStorage) {
		// Delete File instances to ensure that only File instances with references to Blobs exist
		await deleteInstancesOfType(storage, FileTypeRef)
		// The business flag on the CustomerInfo's PlanConfiguration has been split in two, and one of the new flags inherits the value from the old one, but
		// we need to populate the other one still.
		await deleteInstancesOfType(storage, CustomerInfoTypeRef)
		// We also delete UserType ref to disable offline login. Otherwise, clients will see an unexpected error message with pure offline login.
		// await deleteInstancesOfType(storage, UserTypeRef)
	},
}
