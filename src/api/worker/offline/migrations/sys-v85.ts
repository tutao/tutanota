import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys85: OfflineMigration = {
	app: "sys",
	version: 85,
	async migrate(storage: OfflineStorage) {
		// no-op, missed notifications are not cached so we don't need to migrate them.
	},
}
