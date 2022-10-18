import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"
import {CalendarEvent, CalendarEventTypeRef} from "../../../entities/tutanota/TypeRefs"
import {getElementId, getListId} from "../../../common/utils/EntityUtils"

export const repair1: OfflineMigration = {
	app: "repair",
	version: 1,
	async migrate(storage: OfflineStorage) {
		const allCalendarEvents: Array<CalendarEvent> = await storage.getListElementsOfType(CalendarEventTypeRef)
		const possiblyBrokenEvents = allCalendarEvents.filter(calendarEvent => calendarEvent.startTime.getTime() === 0 || calendarEvent.endTime.getTime() === 0)
		const brokenListIDs = new Set(possiblyBrokenEvents.map(getListId))
		for (const listID of brokenListIDs) {
			await storage.deleteRange(CalendarEventTypeRef, listID)
		}
	}
}