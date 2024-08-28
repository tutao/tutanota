import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { UserSettingsGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { GroupInfoTypeRef } from "../../../entities/sys/TypeRefs.js"
import { GroupType } from "../../../common/TutanotaConstants.js"
import { getElementId, getListId } from "../../../common/utils/EntityUtils.js"
import { AuditLogEntryTypeRef } from "../../../entities/sys/TypeRefs.js"

export const tutanota75: OfflineMigration = {
	app: "tutanota",
	version: 75,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef)
		// required to throw the LoginIncompleteError when trying async login
		const groupInfos = await storage.getListElementsOfType(GroupInfoTypeRef)
		for (const groupInfo of groupInfos) {
			if (groupInfo.groupType !== GroupType.User) continue
			await storage.deleteIfExists(GroupInfoTypeRef, getListId(groupInfo), getElementId(groupInfo))
		}
		await deleteInstancesOfType(storage, AuditLogEntryTypeRef)
	},
}
