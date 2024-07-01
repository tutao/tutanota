import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllListElements } from "../StandardMigrations.js"
import { MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { createCustomerInfo, CustomerInfoTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys94: OfflineMigration = {
	app: "sys",
	version: 94,
	async migrate(storage: OfflineStorage) {
		// these are due to the mailbody migration
		await deleteInstancesOfType(storage, MailTypeRef)
		await deleteInstancesOfType(storage, UserTypeRef)
		// this is to add the customerInfo.supportInfo field (sys94)
		await migrateAllListElements(CustomerInfoTypeRef, storage, [createCustomerInfo])
	},
}
