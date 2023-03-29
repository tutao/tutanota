import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { CalendarEventTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"

export const tutanota61: OfflineMigration = {
	app: "tutanota",
	version: 61,
	async migrate(storage: OfflineStorage) {
		// we need to delete them because we may already have added exclusions to an event
		// with a newer client and cached it with the older client.
		// server will have back-migrated the exclusions away and there's no way for us to get at
		// them without re-downlading.
		await deleteInstancesOfType(storage, CalendarEventTypeRef)
	},
}
