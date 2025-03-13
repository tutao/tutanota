import { SomeEntity } from "../../../common/EntityTypes.js"
import { CalendarEvent, Mail } from "../../../entities/tutanota/TypeRefs.js"
import { freezeMap, getTypeId, TypeRef } from "@tutao/tutanota-utils"
import { ExposedCacheStorage } from "../DefaultEntityRestCache.js"
import { User } from "../../../entities/sys/TypeRefs"
import { EntityUpdateData } from "../../../common/utils/EntityUpdateUtils"

/**
 * update when implementing custom cache handlers.
 * add new types to the union when implementing new
 * custom cache handlers.
 */
export type CustomCacheHandledType = never | CalendarEvent | Mail | User

/**
 * makes sure that any {ref<A>, handler<A>} pair passed to
 * the constructor uses the same A for both props and that they
 * are types for which we actually do custom handling.
 */
export type CustomCacheHandlerMapping = CustomCacheHandledType extends infer A
	? A extends SomeEntity
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
	private readonly handlers: ReadonlyMap<string, CustomCacheHandler<SomeEntity>>

	constructor(...args: ReadonlyArray<CustomCacheHandlerMapping>) {
		const handlers: Map<string, CustomCacheHandler<SomeEntity>> = new Map()
		for (const { ref, handler } of args) {
			const key = getTypeId(ref)
			handlers.set(key, handler)
		}
		this.handlers = freezeMap(handlers)
	}

	get<T extends SomeEntity>(typeRef: TypeRef<T>): CustomCacheHandler<T> | undefined {
		const typeId = getTypeId(typeRef)
		// map is frozen after the constructor. constructor arg types are set up to uphold this invariant.
		return this.handlers.get(typeId) as CustomCacheHandler<T> | undefined
	}
}

/**
 * Some types are not cached like other types, for example because their custom Ids are not sortable.
 * make sure to update CustomHandledType when implementing this for a new type.
 */
export interface CustomCacheHandler<T extends SomeEntity> {
	loadRange?: (storage: ExposedCacheStorage, listId: Id, start: Id, count: number, reverse: boolean) => Promise<T[]>

	getElementIdsInCacheRange?: (storage: ExposedCacheStorage, listId: Id, ids: Array<Id>) => Promise<Array<Id>>

	shouldLoadOnCreateEvent?: (event: EntityUpdateData) => boolean

	onBeforeUpdate?: (newEntity: T) => Promise<void>

	onBeforeDelete?: (id: T["_id"]) => Promise<void>
}
