import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys99: OfflineMigration = {
	app: "sys",
	version: 99,
	async migrate(storage: OfflineStorage) {
		// only changes MissedNotification which we do not load nor cache
	},
}
