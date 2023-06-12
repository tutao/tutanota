import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { BookingTypeRef, CustomerInfoTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys87: OfflineMigration = {
	app: "sys",
	version: 87,
	async migrate(storage: OfflineStorage) {
		// we only added customPlan to customerInfo and don't need to migrate anything (as it is only retrieved via the PlanService)
	},
}
