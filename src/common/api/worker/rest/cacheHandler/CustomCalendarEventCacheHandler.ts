import { CustomCacheHandler } from "./CustomCacheHandler"
import {
	AttributeModel,
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	elementIdPart,
	firstBiggerThanSecond,
	getElementId,
	getServerIdEncodingForType,
	LOAD_MULTIPLE_LIMIT,
	ServerModelParsedInstance,
	tutanotaTypeRefs,
	TypeModel,
	TypeModelResolver,
} from "@tutao/typerefs"
import { CacheStorage, Range } from "../DefaultEntityRestCache"
import { EntityRestClient } from "../EntityRestClient"
import { ProgrammingError } from "@tutao/app-env"

/**
 * implements range loading in JS because the custom Ids of calendar events prevent us from doing
 * this effectively in the database.
 */
export class CustomCalendarEventCacheHandler implements CustomCacheHandler<tutanotaTypeRefs.CalendarEvent> {
	constructor(
		private readonly entityRestClient: EntityRestClient,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	async loadRange(storage: CacheStorage, listId: Id, start: Id, count: number, reverse: boolean): Promise<tutanotaTypeRefs.CalendarEvent[]> {
		const range = await storage.getRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(tutanotaTypeRefs.CalendarEventTypeRef)

		// if offline db for this list is empty load from server
		let rawList: Array<ServerModelParsedInstance> = []
		if (range == null) {
			let chunk: Array<ServerModelParsedInstance> = []
			let currentMinId = CUSTOM_MIN_ID
			while (true) {
				chunk = await this.entityRestClient.loadParsedInstancesRange(
					tutanotaTypeRefs.CalendarEventTypeRef,
					listId,
					currentMinId,
					LOAD_MULTIPLE_LIMIT,
					false,
				)
				rawList.push(...chunk)
				if (chunk.length < LOAD_MULTIPLE_LIMIT) break
				const lastEvent = chunk[chunk.length - 1]
				currentMinId = eventElementId(typeModel, lastEvent)
			}
			await storage.putMultiple(tutanotaTypeRefs.CalendarEventTypeRef, rawList)

			// we have all events now
			await storage.setNewRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID)
		} else {
			this.assertCorrectRange(range)
			rawList = await storage.getWholeListParsed(tutanotaTypeRefs.CalendarEventTypeRef, listId)
			console.log(`CalendarEvent list ${listId} has ${rawList.length} events`)
		}
		const unsortedList = await this.entityRestClient.mapInstancesToEntity(tutanotaTypeRefs.CalendarEventTypeRef, rawList)

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
		const range = await storage.getRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId)
		if (range) {
			this.assertCorrectRange(range)
			// assume none of the given Ids are already cached to make sure they are loaded now
			return ids
		} else {
			return []
		}
	}
}

function eventElementId(typeModel: TypeModel, lastEvent: ServerModelParsedInstance): Id {
	const lastEventId = AttributeModel.getAttribute<IdTuple>(lastEvent, "_id", typeModel)
	return elementIdPart(lastEventId)
}
