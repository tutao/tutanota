import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllElements, removeValue } from "../StandardMigrations.js"
import { CustomerTypeRef } from "../../../entities/sys/TypeRefs.js"
import { CalendarGroupRootTypeRef, GroupSettingsTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const tutanota73: OfflineMigration = {
	app: "tutanota",
	version: 73,
	async migrate(storage: OfflineStorage) {
		// Only GroupSettingsTypeRef changed
	},
}
