import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const offline5: OfflineMigration = {
	version: 5,
	async migrate(storage: OfflineStorage) {
		// Offline migrations are not needed anymore after releasing attribute Ids,
		// because we will always store data in the version the server sends the data.
		// From now on, the server always sends data in the activeApplicationVersionsForWritingSum.
		await storage.purgeStorage()
	},
}
