import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { ReceivedGroupInvitationTypeRef, SentGroupInvitationTypeRef, UserGroupRootTypeRef } from "../../../entities/sys/TypeRefs.js"

export const tutanota71: OfflineMigration = {
	app: "tutanota",
	version: 71,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, UserGroupRootTypeRef)
		await deleteInstancesOfType(storage, ReceivedGroupInvitationTypeRef)
		await deleteInstancesOfType(storage, SentGroupInvitationTypeRef)
	},
}
