import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys125: OfflineMigration = {
	app: "sys",
	version: 125,
	async migrate(storage: OfflineStorage) {},
}
