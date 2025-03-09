import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys124: OfflineMigration = {
	app: "sys",
	version: 124,
	async migrate(storage: OfflineStorage) {},
}
