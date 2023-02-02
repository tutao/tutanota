import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"

export const sys84: OfflineMigration = {
	app: "sys",
	version: 84,
	async migrate(storage: OfflineStorage) {
		// no need to do anything as all existing types that were modified (customer, customerInfo) either only have
		// information for new customers or the information will anyway be requested with the ReferralCodeService
	},
}
