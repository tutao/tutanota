import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys115: OfflineMigration = {
	app: "sys",
	version: 115,
	async migrate(storage: OfflineStorage) {
		// Nothing to migrate here, only App Store subscription changes
	},
}
