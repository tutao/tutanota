import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, migrateAllElements, migrateAllListElements } from "../StandardMigrations.js"
import { MailBoxTypeRef, MailFolderTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { GENERATED_MIN_ID } from "../../../common/utils/EntityUtils.js"

export const tutanota74: OfflineMigration = {
	app: "tutanota",
	version: 74,
	async migrate(storage: OfflineStorage) {
		// the TutanotaModelV74 introduces MailSets to support import and labels
		await migrateAllListElements(MailFolderTypeRef, storage, [addValue("isLabel", "0"), addValue("isMailSet", "0"), addValue("entries", GENERATED_MIN_ID)])
		await migrateAllElements(MailBoxTypeRef, storage, [addValue("archivedMailBags", []), addValue("currentMailBag", null)])
		await migrateAllListElements(MailTypeRef, storage, [addValue("sets", [])])
	},
}
