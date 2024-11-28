import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations"
import { CalendarEvent, CalendarEventTypeRef } from "../../../entities/tutanota/TypeRefs"

export const tutanota78: OfflineMigration = {
	app: "tutanota",
	version: 78,
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
