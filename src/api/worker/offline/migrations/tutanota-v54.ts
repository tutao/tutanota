import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {migrateAllElements} from "../StandardMigrations.js"
import {createUserSettingsGroupRoot, UserSettingsGroupRootTypeRef} from "../../../entities/tutanota/TypeRefs.js"

export const tutanota54: OfflineMigration = {
	app: "tutanota",
	version: 54,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(UserSettingsGroupRootTypeRef, storage, [
			createUserSettingsGroupRoot
		])
	}
}
