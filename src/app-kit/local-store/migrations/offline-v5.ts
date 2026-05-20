import { OfflineStorage } from "../OfflineStorage.js"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 5
export class offline5 extends OfflineMigration {
	constructor() {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage): Promise<void> {
		// Offline migrations are not needed anymore after releasing attribute Ids,
		// because we will always store data in the version the server sends the data.
		// From now on, the server always sends data in the activeApplicationVersionsForWritingSum.
		await storage.purgeStorage()
	}
}
