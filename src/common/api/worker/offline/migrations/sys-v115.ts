import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations.js"
import { CalendarEventTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const sys115: OfflineMigration = {
	app: "sys",
	version: 115,
	async migrate(storage: OfflineStorage) {
		// FIXME
		await migrateAllListElements(CalendarEventTypeRef, storage, [
			// (calendarEvent: CalendarEvent) => {
			// 	if (calendarEvent.repeatRule) {
			// 		calendarEvent.repeatRule.advancedRules = []
			// 	}
			// 	return calendarEvent
			// },
		])
	},
}
