import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const tutanota72: OfflineMigration = {
	app: "tutanota",
	version: 72,
	async migrate(storage: OfflineStorage) {
		// only data transfer types have been modified
	},
}
