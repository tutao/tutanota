import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {RootInstance} from "../entities/sys/TypeRefs.js"
import {RootInstanceTypeRef} from "../entities/sys/TypeRefs.js"
import {CUSTOM_MIN_ID, GENERATED_MIN_ID, getElementId, getLetId, RANGE_ITEM_LIMIT} from "./utils/EntityUtils"
import {Type, ValueType} from "./EntityConstants"
import {last, TypeRef} from "@tutao/tutanota-utils"
import {getFirstIdIsBiggerFnForType, resolveTypeReference} from "./EntityFunctions"
import type {ElementEntity, ListElementEntity, SomeEntity} from "./EntityTypes"
import {downcast} from "@tutao/tutanota-utils";

export class EntityClient {
	_target: EntityRestInterface

	constructor(target: EntityRestInterface) {
		this._target = target
	}

	load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, query?: Dict, extraHeaders?: Dict): Promise<T> {
		return this._target.load(typeRef, id, query, extraHeaders)
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
		const comparator = getFirstIdIsBiggerFnForType(typeModel)
		const filteredEntities = loadedEntities.filter(entity => comparator(getElementId(entity), end))

		if (filteredEntities.length === rangeItemLimit) {
			const lastElementId = getElementId(filteredEntities[loadedEntities.length - 1])
			const {
				elements: remainingEntities,
				loadedCompletely
			} = await this.loadReverseRangeBetween<T>(typeRef, listId, lastElementId, end, rangeItemLimit)
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
	loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Id[]): Promise<T[]> {
		return this._target.loadMultiple(typeRef, listId, elementIds)
	}

	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict): Promise<Id> {
		return this._target.setup(listId, instance, extraHeaders)
	}

	setupMultipleEntities<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		return this._target.setupMultiple(listId, instances)
	}

	update<T extends SomeEntity>(instance: T): Promise<void> {
		return this._target.update(instance)
	}

	erase<T extends SomeEntity>(instance: T): Promise<void> {
		return this._target.erase(instance)
	}

	async loadRoot<T extends ElementEntity>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		const typeModel = await resolveTypeReference(typeRef)
		const rootId = [groupId, typeModel.rootId] as const
		const root = await this.load<RootInstance>(RootInstanceTypeRef, rootId)
		return this.load<T>(typeRef, downcast(root.reference)) // FIXME Passing in Id here should be allowed?
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