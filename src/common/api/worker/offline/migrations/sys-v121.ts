import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const sys121: OfflineMigration = {
	app: "sys",
	version: 121,
	async migrate(storage: OfflineStorage) {},
}
