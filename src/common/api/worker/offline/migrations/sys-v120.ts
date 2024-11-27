import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys120: OfflineMigration = {
	app: "sys",
	version: 120,
	async migrate(storage: OfflineStorage) {},
}
