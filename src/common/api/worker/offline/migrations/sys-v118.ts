import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys118: OfflineMigration = {
	app: "sys",
	version: 118,
	async migrate(storage: OfflineStorage) {},
}
