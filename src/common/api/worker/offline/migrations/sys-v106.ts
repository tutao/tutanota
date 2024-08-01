import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys106: OfflineMigration = {
	app: "sys",
	version: 106,
	async migrate(storage: OfflineStorage) {
		// only changes data transfer type
	},
}
