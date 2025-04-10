import { CalendarEvent, CalendarEventTypeRef } from "../../../entities/tutanota/TypeRefs"
import { EntityRestClient } from "../EntityRestClient"
import { CacheStorage, Range } from "../DefaultEntityRestCache"
import { CUSTOM_MAX_ID, CUSTOM_MIN_ID, firstBiggerThanSecond, getElementId, LOAD_MULTIPLE_LIMIT } from "../../../common/utils/EntityUtils"
import { resolveTypeReference } from "../../../common/EntityFunctions"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { CustomCacheHandler } from "./CustomCacheHandler"

/**
 * implements range loading in JS because the custom Ids of calendar events prevent us from doing
 * this effectively in the database.
 */
export class CustomCalendarEventCacheHandler implements CustomCacheHandler<CalendarEvent> {
	constructor(private readonly entityRestClient: EntityRestClient) {}

	async loadRange(storage: CacheStorage, listId: Id, start: Id, count: number, reverse: boolean): Promise<CalendarEvent[]> {
		const range = await storage.getRangeForList(CalendarEventTypeRef, listId)

		//if offline db for this list is empty load from server
		let rawList: Array<CalendarEvent> = []
		if (range == null) {
			let chunk: Array<CalendarEvent> = []
			let currentMin = CUSTOM_MIN_ID
			while (true) {
				chunk = await this.entityRestClient.loadRange(CalendarEventTypeRef, listId, currentMin, LOAD_MULTIPLE_LIMIT, false)
				rawList.push(...chunk)
				if (chunk.length < LOAD_MULTIPLE_LIMIT) break
				currentMin = getElementId(chunk[chunk.length - 1])
			}
			for (const event of rawList) {
				await storage.put(event)
			}

			// we have all events now
			await storage.setNewRangeForList(CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID)
		} else {
			this.assertCorrectRange(range)
			rawList = await storage.getWholeList(CalendarEventTypeRef, listId)
			console.log(`CalendarEvent list ${listId} has ${rawList.length} events`)
		}
		const typeModel = await resolveTypeReference(CalendarEventTypeRef)
		const sortedList = reverse
			? rawList
					.filter((calendarEvent) => firstBiggerThanSecond(start, getElementId(calendarEvent), typeModel))
					.sort((a, b) => (firstBiggerThanSecond(getElementId(b), getElementId(a), typeModel) ? 1 : -1))
			: rawList
					.filter((calendarEvent) => firstBiggerThanSecond(getElementId(calendarEvent), start, typeModel))
					.sort((a, b) => (firstBiggerThanSecond(getElementId(a), getElementId(b), typeModel) ? 1 : -1))
		return sortedList.slice(0, count)
	}

	private assertCorrectRange(range: Range) {
		if (range.lower !== CUSTOM_MIN_ID || range.upper !== CUSTOM_MAX_ID) {
			throw new ProgrammingError(`Invalid range for CalendarEvent: ${JSON.stringify(range)}`)
		}
	}

	async getElementIdsInCacheRange(storage: CacheStorage, listId: Id, ids: Array<Id>): Promise<Array<Id>> {
		const range = await storage.getRangeForList(CalendarEventTypeRef, listId)
		if (range) {
			this.assertCorrectRange(range)
			// assume none of the given Ids are already cached to make sure they are loaded now
			return ids
		} else {
			return []
		}
	}
}
