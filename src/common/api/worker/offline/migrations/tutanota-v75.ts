import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { UserSettingsGroupRootTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { AuditLogEntryTypeRef } from "../../../entities/sys/TypeRefs.js"

export const tutanota75: OfflineMigration = {
	app: "tutanota",
	version: 75,
	async migrate(storage: OfflineStorage) {
		await deleteInstancesOfType(storage, UserSettingsGroupRootTypeRef)
		await deleteInstancesOfType(storage, AuditLogEntryTypeRef)
	},
}
