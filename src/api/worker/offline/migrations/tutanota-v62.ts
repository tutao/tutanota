import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { CalendarEventTypeRef, CalendarEventUidIndexTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"

export const tutanota62: OfflineMigration = {
	app: "tutanota",
	version: 62,
	async migrate(storage: OfflineStorage) {
		// we need to delete them because we may already have added recurrenceIds to an event
		// with a newer client and cached it with the older client.
		// server will have back-migrated the recurrenceId away and there's no way for us to get at
		// them without re-downlading.
		await deleteInstancesOfType(storage, CalendarEventTypeRef)
		await deleteInstancesOfType(storage, CalendarEventUidIndexTypeRef)
	},
}
