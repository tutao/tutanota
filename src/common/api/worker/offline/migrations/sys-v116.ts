import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
export const sys116: OfflineMigration = {
	app: "sys",
	version: 116,
	async migrate(storage: OfflineStorage) {
		// only Downgraded customer was added so nothing to migrate
	},
}
