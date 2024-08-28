import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, deleteInstancesOfType, migrateAllElements, migrateAllListElements } from "../StandardMigrations.js"
import { CalendarEventTypeRef, createMail, createMailBox, MailBoxTypeRef, MailFolderTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { GENERATED_MIN_ID } from "../../../common/utils/EntityUtils.js"

export const tutanota74: OfflineMigration = {
	app: "tutanota",
	version: 74,
	async migrate(storage: OfflineStorage) {
		// the TutanotaModelV74 introduces MailSets to support import and labels
		await migrateAllListElements(MailFolderTypeRef, storage, [
			addValue("isLabel", false),
			addValue("isMailSet", false),
			addValue("entries", GENERATED_MIN_ID),
		])
		await migrateAllElements(MailBoxTypeRef, storage, [createMailBox]) // initialize mailbags
		await migrateAllListElements(MailTypeRef, storage, [createMail]) // initialize sets

		// we need to delete all CalendarEvents since we changed the format for storing customIds (CalendarEvents use customIds) in the offline database
		// all entities with customIds, that are stored in the offline database (e.g. CalendarEvent, MailSetEntry),
		// are from now on stored in the offline database using a **base64Ext** encoded id string
		await deleteInstancesOfType(storage, CalendarEventTypeRef)
	},
}
