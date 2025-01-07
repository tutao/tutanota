import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { MailBoxTypeRef, UserSettingsGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs"
import { GENERATED_MIN_ID, getElementId, getListId } from "../../../common/utils/EntityUtils"
import { GroupInfoTypeRef } from "../../../entities/sys/TypeRefs"
import { deleteInstancesOfType } from "../StandardMigrations"
import { GroupType } from "../../../common/TutanotaConstants"

/**
 * Migration to re-download mailboxes with importMailStates and importedAttachment
 * lists pointing to a wrong value.
 */
export const offline3: OfflineMigration = {
	app: "offline",
	version: 3,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		let mailboxes = await storage.getElementsOfType(MailBoxTypeRef)
		let needsOfflineDisable = false
		for (const mailbox of mailboxes) {
			if (mailbox.importedAttachments !== GENERATED_MIN_ID && mailbox.mailImportStates !== GENERATED_MIN_ID) {
				continue
			}
			// delete the offending instance
			await storage.deleteIfExists(MailBoxTypeRef, null, mailbox._id)
			needsOfflineDisable = true
		}

		if (needsOfflineDisable) {
			// also prevent the user's offline login from requesting the mailbox
			// before it's fully logged in
			await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef)
			// required to throw the LoginIncompleteError when trying async login
			const groupInfos = await storage.getRawListElementsOfType(GroupInfoTypeRef)
			for (const groupInfo of groupInfos) {
				if ((groupInfo as any).groupType !== GroupType.User) continue
				await storage.deleteIfExists(GroupInfoTypeRef, getListId(groupInfo), getElementId(groupInfo))
			}
		}
	},
}
