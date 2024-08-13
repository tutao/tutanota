import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements } from "../StandardMigrations.js"
import { UserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota75: OfflineMigration = {
	app: "tutanota",
	version: 75,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(UserSettingsGroupRootTypeRef, storage, [
			(oldUserSettings: UserSettingsGroupRoot) => {
				oldUserSettings.groupSettings = oldUserSettings.groupSettings.map((settings) => {
					return { ...settings, sourceUrl: null }
				})

				return oldUserSettings
			},
		])
	},
}
