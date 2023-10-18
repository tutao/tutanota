import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements, migrateAllListElements } from "../StandardMigrations.js"
import { CustomerInfo, CustomerInfoTypeRef, Group, GroupTypeRef, KeyPairTypeRef, User, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { KdfType } from "../../../common/TutanotaConstants.js"

export const sys91: OfflineMigration = {
	app: "sys",
	version: 91,
	async migrate(storage: OfflineStorage) {
		// KeyPair was changed
		await deleteInstancesOfType(storage, GroupTypeRef)
	},
}
