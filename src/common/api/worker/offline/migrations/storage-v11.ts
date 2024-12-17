import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const storage11: OfflineMigration = {
	app: "storage",
	version: 11,
	async migrate(storage: OfflineStorage) {},
}
