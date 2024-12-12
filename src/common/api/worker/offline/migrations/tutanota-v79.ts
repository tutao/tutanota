import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, migrateAllElements } from "../StandardMigrations"
import { MailBoxTypeRef } from "../../../entities/tutanota/TypeRefs"
import { GENERATED_MIN_ID } from "../../../common/utils/EntityUtils"

export const tutanota79: OfflineMigration = {
	app: "tutanota",
	version: 79,
	async migrate(storage: OfflineStorage) {
		await migrateAllElements(MailBoxTypeRef, storage, [addValue("importedAttachments", GENERATED_MIN_ID), addValue("mailImportStates", GENERATED_MIN_ID)])
	},
}
