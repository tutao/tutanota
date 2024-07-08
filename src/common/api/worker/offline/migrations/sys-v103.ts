import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys103: OfflineMigration = {
	app: "sys",
	version: 103,
	async migrate(storage: OfflineStorage) {
		// Just add app field to PushIdentifiers, no migration needed
	},
}
