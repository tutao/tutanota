import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations.js"
import { CalendarEvent, CalendarEventTypeRef } from "../../../entities/tutanota/TypeRefs.js"

export const sys118: OfflineMigration = {
	app: "sys",
	version: 118,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(CalendarEventTypeRef, storage, [
			(calendarEvent: CalendarEvent) => {
				if (calendarEvent.repeatRule) {
					calendarEvent.repeatRule.advancedRules = []
				}
				return calendarEvent
			},
		])
	},
}
