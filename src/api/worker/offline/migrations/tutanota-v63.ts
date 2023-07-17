import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"

export const tutanota63: OfflineMigration = {
	app: "tutanota",
	version: 63,
	async migrate(_: OfflineStorage) {},
}
