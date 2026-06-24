import { CustomCacheHandler } from "../../../../app-kit/local-store/CustomCacheHandler"
import { CUSTOM_MAX_ID, CUSTOM_MIN_ID, elementIdPart, firstBiggerThanSecond, getElementId, getServerIdEncodingForType, LOAD_MULTIPLE_LIMIT } from "@tutao/meta"
import { Range } from "../../../../app-kit/local-store/OfflineStorage.js"
import { ProgrammingError } from "@tutao/app-env"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { EntityRestClient } from "../../../../platform-kit/network/EntityRestClient"
import { CalendarEvent, CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { DecryptedParsedInstance, TypeModelResolver } from "@tutao/instance-pipeline"

/**
 * implements range loading in JS because the custom Ids of calendar events prevent us from doing
 * this effectively in the database.
 */
export class CustomCalendarEventCacheHandler implements CustomCacheHandler<CalendarEvent> {
	constructor(
		private readonly entityRestClient: EntityRestClient,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	async loadRange(storage: CacheStorage, listId: Id, start: Id, count: number, reverse: boolean): Promise<CalendarEvent[]> {
		const range = await storage.getRangeForList(CalendarEventTypeRef, listId)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(CalendarEventTypeRef)

		// if offline db for this list is empty load from server
		let rawList = new Array<DecryptedParsedInstance>()
		if (range == null) {
			let chunk = new Array<DecryptedParsedInstance>()
			let currentMinId = CUSTOM_MIN_ID
			while (true) {
				chunk = await this.entityRestClient.loadParsedInstancesRange(CalendarEventTypeRef, listId, currentMinId, LOAD_MULTIPLE_LIMIT, false)
				rawList.push(...chunk)
				if (chunk.length < LOAD_MULTIPLE_LIMIT) break
				const lastEvent = chunk[chunk.length - 1]
				currentMinId = elementIdPart(lastEvent.getAttributeByName("_id").asIdTuple())
			}
			await storage.putMultiple(CalendarEventTypeRef, rawList)

			// we have all events now
			await storage.setNewRangeForList(CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID)
		} else {
			this.assertCorrectRange(range)
			rawList = await storage.getWholeListParsed(CalendarEventTypeRef, listId)
			console.log(`CalendarEvent list ${listId} has ${rawList.length} events`)
		}
		const unsortedList = await this.entityRestClient.mapInstancesToEntity(CalendarEventTypeRef, rawList)

		const idEncoding = getServerIdEncodingForType(typeModel)
		const sortedList = reverse
			? unsortedList
					.filter((calendarEvent) => firstBiggerThanSecond(start, getElementId(calendarEvent), idEncoding))
					.sort((a, b) => (firstBiggerThanSecond(getElementId(b), getElementId(a), idEncoding) ? 1 : -1))
			: unsortedList
					.filter((calendarEvent) => firstBiggerThanSecond(getElementId(calendarEvent), start, idEncoding))
					.sort((a, b) => (firstBiggerThanSecond(getElementId(a), getElementId(b), idEncoding) ? 1 : -1))
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
