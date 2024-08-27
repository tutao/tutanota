import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType, migrateAllElements } from "../StandardMigrations.js"
import { UserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota75: OfflineMigration = {
	app: "tutanota",
	version: 75,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef)
	},
}
