import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations.js"
import { CustomerInfo, CustomerInfoTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys89: OfflineMigration = {
	app: "sys",
	version: 89,
	async migrate(storage: OfflineStorage) {
		// we've added a new field to PlanConfig and we want to make sure that it's correct in the future
		// anyone who has a custom plan at the moment does not have the contact list
		await migrateAllListElements(CustomerInfoTypeRef, storage, [
			(oldCustomerInfo: CustomerInfo) => {
				if (oldCustomerInfo.customPlan) {
					oldCustomerInfo.customPlan.contactList = false
				}
				return oldCustomerInfo
			},
		])
	},
}
