import {
	EntityRestClientLoadOptions,
	EntityRestClientSetupOptions,
	EntityRestClientUpdateOptions,
	EntityRestInterface,
	OwnerEncSessionKeyProvider,
} from "../worker/rest/EntityRestClient"
import type { RootInstance } from "../entities/sys/TypeRefs.js"
import { RootInstanceTypeRef } from "../entities/sys/TypeRefs.js"
import {
	CUSTOM_MIN_ID,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MIN_ID,
	getElementId,
	getLetId,
	listIdPart,
	RANGE_ITEM_LIMIT,
} from "./utils/EntityUtils"
import { Type, ValueType } from "./EntityConstants.js"
import { downcast, groupByAndMap, last, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { resolveTypeReference } from "./EntityFunctions"
import type { ElementEntity, ListElementEntity, SomeEntity } from "./EntityTypes"
import { NotAuthorizedError, NotFoundError } from "./error/RestError.js"

export class EntityClient {
	_target: EntityRestInterface

	constructor(target: EntityRestInterface) {
		this._target = target
	}

	/**
	 * Important: we can't pass functions through the bridge, so we can't pass ownerKeyProvider from the page context.
	 */
	load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		return this._target.load(typeRef, id, opts)
	}

	async loadAll<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start?: Id): Promise<T[]> {
		const typeModel = await resolveTypeReference(typeRef)

		if (!start) {
			start = typeModel.values["_id"].type === ValueType.GeneratedId ? GENERATED_MIN_ID : CUSTOM_MIN_ID
		}

		const elements = await this.loadRange<T>(typeRef, listId, start, RANGE_ITEM_LIMIT, false)
		if (elements.length === RANGE_ITEM_LIMIT) {
			let lastElementId = getLetId(elements[elements.length - 1])[1]
			const nextElements = await this.loadAll<T>(typeRef, listId, lastElementId)
			return elements.concat(nextElements)
		} else {
			return elements
		}
	}

	async loadReverseRangeBetween<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		end: Id,
		rangeItemLimit: number = RANGE_ITEM_LIMIT,
	): Promise<{
		elements: T[]
		loadedCompletely: boolean
	}> {
		const typeModel = await resolveTypeReference(typeRef)
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		const loadedEntities = await this._target.loadRange<T>(typeRef, listId, start, rangeItemLimit, true)
		const filteredEntities = loadedEntities.filter((entity) => firstBiggerThanSecond(getElementId(entity), end, typeModel))

		if (filteredEntities.length === rangeItemLimit) {
			const lastElementId = getElementId(filteredEntities[loadedEntities.length - 1])
			const { elements: remainingEntities, loadedCompletely } = await this.loadReverseRangeBetween<T>(typeRef, listId, lastElementId, end, rangeItemLimit)
			return {
				elements: filteredEntities.concat(remainingEntities),
				loadedCompletely,
			}
		} else {
			return {
				elements: filteredEntities,
				loadedCompletely: wasReverseRangeCompletelyLoaded(rangeItemLimit, loadedEntities, filteredEntities),
			}
		}
	}

	loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return this._target.loadRange(typeRef, listId, start, count, reverse)
	}

	/**
	 * load multiple does not guarantee order or completeness of returned elements.
	 */
	loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Id[],
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<T[]> {
		return this._target.loadMultiple(typeRef, listId, elementIds, ownerEncSessionKeyProvider)
	}

	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id> {
		return this._target.setup(listId, instance, extraHeaders, options)
	}

	setupMultipleEntities<T extends SomeEntity>(listId: Id | null, instances: ReadonlyArray<T>): Promise<Array<Id>> {
		return this._target.setupMultiple(listId, instances)
	}

	update<T extends SomeEntity>(instance: T, options?: EntityRestClientUpdateOptions): Promise<void> {
		return this._target.update(instance, options)
	}

	erase<T extends SomeEntity>(instance: T): Promise<void> {
		return this._target.erase(instance)
	}

	async loadRoot<T extends ElementEntity>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		const typeModel = await resolveTypeReference(typeRef)
		const rootId = [groupId, typeModel.rootId] as const
		const root = await this.load<RootInstance>(RootInstanceTypeRef, rootId)
		return this.load<T>(typeRef, downcast(root.reference))
	}
}

function wasReverseRangeCompletelyLoaded<T extends ListElementEntity>(rangeItemLimit: number, loadedEntities: Array<T>, filteredEntities: Array<T>): boolean {
	if (loadedEntities.length < rangeItemLimit) {
		const lastLoaded = last(loadedEntities)
		const lastFiltered = last(filteredEntities)

		if (!lastLoaded) {
			return true
		}

		return lastLoaded === lastFiltered
	}

	return false
}

/**
 * load multiple instances of the same type concurrently from multiple lists using
 * one request per list if possible
 *
 * @returns an array of all the instances excluding the ones throwing NotFoundError or NotAuthorizedError, in arbitrary order.
 */
export async function loadMultipleFromLists<T extends ListElementEntity>(
	type: TypeRef<T>,
	entityClient: EntityClient,
	toLoad: Array<IdTuple>,
): Promise<Array<T>> {
	if (toLoad.length === 0) {
		return []
	}
	const indexedEventIds = groupByAndMap<IdTuple, Id, Id>(toLoad, listIdPart, elementIdPart)

	return (
		await promiseMap(
			indexedEventIds,
			async ([listId, elementIds]) => {
				try {
					return await entityClient.loadMultiple(type, listId, elementIds)
				} catch (e) {
					// these are thrown if the list itself is inaccessible. elements will just be missing
					// in the loadMultiple result.
					if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
						console.log(`could not load entities of type ${type} from list ${listId}: ${e.name}`)
						return []
					} else {
						throw e
					}
				}
			},
			{ concurrency: 3 },
		)
	).flat()
}
