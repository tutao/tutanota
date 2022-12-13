import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {migrateAllElements, renameAttribute} from "../StandardMigrations.js"
import {MailBoxTypeRef} from "../../../entities/tutanota/TypeRefs.js"

export const tutanota57: OfflineMigration = {
	app: "tutanota",
	version: 57,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailBoxTypeRef, storage, [
			renameAttribute("systemFolders", "folders")
		])
	}
}
