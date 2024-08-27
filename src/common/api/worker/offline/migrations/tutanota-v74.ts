import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { addValue, deleteInstancesOfType, migrateAllElements, migrateAllListElements } from "../StandardMigrations.js"
import {
	ContactTypeRef,
	createMail,
	createMailBox,
	MailBoxTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
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

		// we need to re-initialize the UserSettingsGroupRoot to add a default value for defaultAlarmsList on GroupSettings
		await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef)
	},
}
