import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys107: OfflineMigration = {
	app: "sys",
	version: 107,
	async migrate(storage: OfflineStorage) {
		// only changes data transfer type
	},
}
