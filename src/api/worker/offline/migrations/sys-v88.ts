import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys88: OfflineMigration = {
	app: "sys",
	version: 88,
	async migrate(storage: OfflineStorage) {
		// we only changed data transfer types
	},
}
