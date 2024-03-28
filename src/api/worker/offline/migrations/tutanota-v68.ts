import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addOwnerKeyVersion, migrateAllElements, migrateAllListElements, Migration, renameAttribute } from "../StandardMigrations.js"
import { ElementEntity, ListElementEntity, SomeEntity } from "../../../common/EntityTypes.js"
import { TypeRef } from "@tutao/tutanota-utils"
import {
	CalendarEventTypeRef,
	CalendarEventUpdateTypeRef,
	CalendarGroupRootTypeRef,
	ContactListEntryTypeRef,
	ContactListGroupRootTypeRef,
	ContactListTypeRef,
	ContactTypeRef,
	EmailTemplateTypeRef,
	FileSystemTypeRef,
	FileTypeRef,
	KnowledgeBaseEntryTypeRef,
	MailBodyTypeRef,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailFolderTypeRef,
	MailHeadersTypeRef,
	MailTypeRef,
	TemplateGroupRootTypeRef,
	TutanotaPropertiesTypeRef,
	UserSettingsGroupRootTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"

export const tutanota68: OfflineMigration = {
	app: "tutanota",
	version: 67,
	async migrate(storage: OfflineStorage) {
		// TODO migrate manual model changes
		const encryptedElementTypes: Array<TypeRef<ElementEntity>> = [
			FileSystemTypeRef,
			MailBodyTypeRef,
			MailBoxTypeRef,
			ContactListTypeRef,
			TutanotaPropertiesTypeRef,
			MailHeadersTypeRef,
			CalendarGroupRootTypeRef,
			UserSettingsGroupRootTypeRef,
			ContactListGroupRootTypeRef,
			MailboxPropertiesTypeRef,
			TemplateGroupRootTypeRef,
		]

		const encryptedListElementTypes: Array<TypeRef<ListElementEntity>> = [
			FileTypeRef,
			ContactTypeRef,
			MailTypeRef,
			MailFolderTypeRef,
			CalendarEventTypeRef,
			CalendarEventUpdateTypeRef,
			EmailTemplateTypeRef,
			MailDetailsDraftTypeRef,
			MailDetailsBlobTypeRef,
			ContactListEntryTypeRef,
			KnowledgeBaseEntryTypeRef,
		]

		for (const type of encryptedElementTypes) {
			await migrateAllElements(type, storage, [addOwnerKeyVersion()])
		}
		for (const type of encryptedListElementTypes) {
			await migrateAllListElements(type, storage, [addOwnerKeyVersion()])
		}

		await migrateAllListElements(MailTypeRef, storage, [addVersionsToBucketKey()])

		await migrateAllElements(TutanotaPropertiesTypeRef, storage, [renameAttribute("groupEncEntropy", "userEncEntropy")])
	},
}

function addVersionsToBucketKey<T extends SomeEntity>(): Migration<T> {
	return function (entity) {
		const bucketKey = entity["bucketKey"]
		bucketKey["recipientKeyVersion"] = 0
		bucketKey["senderKeyVersion"] = null // Assuming offline stored instances are not TutaCrypt.
		for (const membership of entity["bucketEncSessionKeys"]) {
			membership["symKeyVersion"] = 0
		}
		return entity
	}
}
