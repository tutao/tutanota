import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { migrateAllListElements } from "../StandardMigrations.js"
import { CalendarEvent, CalendarEventTypeRef, createCalendarEvent } from "../../../entities/tutanota/TypeRefs.js"
import { createRepeatRule } from "../../../entities/sys/TypeRefs.js"

function migrateCalendarEvent(oldEvent: CalendarEvent): CalendarEvent {
	if (oldEvent.repeatRule) {
		const repeatRule = createRepeatRule(oldEvent.repeatRule)
		const newEvent = createCalendarEvent(oldEvent)
		newEvent.repeatRule = repeatRule
		return newEvent
	} else {
		return createCalendarEvent(oldEvent)
	}
}

export const tutanota61: OfflineMigration = {
	app: "tutanota",
	version: 61,
	async migrate(storage: OfflineStorage) {
		await migrateAllListElements(CalendarEventTypeRef, storage, [migrateCalendarEvent])
	},
}
