import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, migrateAllListElements, removeValue } from "../StandardMigrations.js"
import { ContactTypeRef, FileTypeRef, MailBoxTypeRef, MailFolderTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota73: OfflineMigration = {
	app: "tutanota",
	version: 73,
	async migrate(storage: OfflineStorage) {
		// the TutanotaModelV73 finally removes all legacy mail (without MailDetails) attributes and types
		// all mails must use MailDetails now
		await migrateAllListElements(MailTypeRef, storage, [
			removeValue("body"),
			removeValue("toRecipients"),
			removeValue("ccRecipients"),
			removeValue("bccRecipients"),
			removeValue("replyTos"),
			removeValue("headers"),
			removeValue("sentDate"),
		])

		// cleanup TutanotaModel
		await migrateAllElements(MailBoxTypeRef, storage, [removeValue("mails")])
		await migrateAllListElements(MailFolderTypeRef, storage, [removeValue("subFolders")])

		// removing Value.OLD_OWNER_GROUP_NAME, and Value.OLD_AREA_ID_NAME from FILE_TYPE and CONTACT_TYPE
		await migrateAllListElements(FileTypeRef, storage, [removeValue("_owner"), removeValue("_area")])
		await migrateAllListElements(ContactTypeRef, storage, [
			removeValue("_owner"),
			removeValue("_area"),
			removeValue("autoTransmitPassword"), // autoTransmitPassword has been removed from ContactType
		])
	},
}
