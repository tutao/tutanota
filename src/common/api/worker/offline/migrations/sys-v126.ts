import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { clearDatabase } from "../StandardMigrations"

export const sys126: OfflineMigration = {
	app: "sys",
	version: 126,
	async migrate(storage: OfflineStorage) {
		// Offline migrations are not needed anymore after releasing attribute Ids,
		// because we will always store data in the version the server sends the data.
		// From now on, the server always sends data in the activeApplicationVersionsForWritingSum.
		await clearDatabase(storage)
	},
}
