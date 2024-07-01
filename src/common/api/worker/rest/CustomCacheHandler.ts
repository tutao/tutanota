import { ListElementEntity } from "../../common/EntityTypes.js"
import { CalendarEvent, CalendarEventTypeRef } from "../../entities/tutanota/TypeRefs.js"
import { freezeMap, getTypeId, TypeRef } from "@tutao/tutanota-utils"
import { CUSTOM_MAX_ID, CUSTOM_MIN_ID, firstBiggerThanSecond, getElementId, LOAD_MULTIPLE_LIMIT } from "../../common/utils/EntityUtils.js"
import { resolveTypeReference } from "../../common/EntityFunctions.js"
import { CacheStorage, ExposedCacheStorage, Range } from "./DefaultEntityRestCache.js"
import { EntityRestClient } from "./EntityRestClient.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"

/**
 * update when implementing custom cache handlers.
 * add new types to the union when implementing new
 * custom cache handlers.
 */
type CustomCacheHandledType = never | CalendarEvent

/**
 * makes sure that any {ref<A>, handler<A>} pair passed to
 * the constructor uses the same A for both props and that they
 * are types for which we actually do custom handling.
 */
type CustomCacheHandlerMapping = CustomCacheHandledType extends infer A
	? A extends ListElementEntity
		? { ref: TypeRef<A>; handler: CustomCacheHandler<A> }
		: never
	: never

/**
 * wrapper for a TypeRef -> CustomCacheHandler map that's needed because we can't
 * use TypeRefs directly as map keys due to object identity not matching.
 *
 * it is mostly read-only
 */
export class CustomCacheHandlerMap {
	private readonly handlers: ReadonlyMap<string, CustomCacheHandler<ListElementEntity>>

	constructor(...args: Array<CustomCacheHandlerMapping>) {
		const handlers: Map<string, CustomCacheHandler<ListElementEntity>> = new Map()
		for (const { ref, handler } of args) {
			const key = getTypeId(ref)
			handlers.set(key, handler)
		}
		this.handlers = freezeMap(handlers)
	}

	get<T extends ListElementEntity>(typeRef: TypeRef<T>): CustomCacheHandler<T> | undefined {
		const typeId = getTypeId(typeRef)
		// map is frozen after the constructor. constructor arg types are set up to uphold this invariant.
		return this.handlers.get(typeId) as CustomCacheHandler<T> | undefined
	}

	has<T extends ListElementEntity>(typeRef: TypeRef<T>): boolean {
		const typeId = getTypeId(typeRef)
		return this.handlers.has(typeId)
	}
}

/**
 * Some types are not cached like other types, for example because their custom Ids are not sortable.
 * make sure to update CustomHandledType when implementing this for a new type.
 */
export interface CustomCacheHandler<T extends ListElementEntity> {
	loadRange(storage: ExposedCacheStorage, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]>

	getElementIdsInCacheRange(storage: ExposedCacheStorage, listId: Id, ids: Array<Id>): Promise<Array<Id>>
}

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
