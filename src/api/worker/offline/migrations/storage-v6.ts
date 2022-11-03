import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const storage6: OfflineMigration = {
	app: "storage",
	version: 6,
	async migrate(storage: OfflineStorage) {},
}
