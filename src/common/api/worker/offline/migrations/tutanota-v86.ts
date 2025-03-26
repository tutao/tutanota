import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const tutanota86: OfflineMigration = {
	app: "tutanota",
	version: 86,
	async migrate(_: OfflineStorage) {
		// why do I need this?
	},
}
