// @flow

import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {RootInstance} from "../entities/sys/RootInstance"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {CUSTOM_MIN_ID, GENERATED_MIN_ID, getElementId, getLetId, RANGE_ITEM_LIMIT} from "./utils/EntityUtils";
import {Type, ValueType} from "./EntityConstants"
import {last, TypeRef} from "@tutao/tutanota-utils";
import {getFirstIdIsBiggerFnForType, resolveTypeReference} from "./EntityFunctions"
import type {ListElementEntity, SomeEntity} from "./EntityTypes"

export class EntityClient {
	_target: EntityRestInterface;

	constructor(target: EntityRestInterface) {
		this._target = target
	}

	load<T: SomeEntity>(typeRef: TypeRef<T>, id: $PropertyType<T, "_id">, query: ?Params, extraHeaders?: Params): Promise<T> {
		return this._target.load(typeRef, id, query, extraHeaders)
	}

	loadAll<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: ?Id): Promise<T[]> {
		return resolveTypeReference(typeRef).then(typeModel => {
			if (!start) {
				start = (typeModel.values["_id"].type === ValueType.GeneratedId) ? GENERATED_MIN_ID : CUSTOM_MIN_ID
			}
			return this.loadRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false).then(elements => {
				if (elements.length === RANGE_ITEM_LIMIT) {
					let lastElementId = getLetId(elements[elements.length - 1])[1]
					return this.loadAll(typeRef, listId, lastElementId).then(nextElements => {
						return elements.concat(nextElements)
					})
				} else {
					return Promise.resolve(elements)
				}
			})
		})
	}

	loadReverseRangeBetween<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id, rangeItemLimit: number = RANGE_ITEM_LIMIT): Promise<{elements: T[], loadedCompletely: boolean}> {
		return resolveTypeReference(typeRef).then(typeModel => {
			if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
			return this._target.loadRange(typeRef, listId, start, rangeItemLimit, true)
			           .then(loadedEntities => {
				           const comparator = getFirstIdIsBiggerFnForType(typeModel)
				           const filteredEntities = loadedEntities.filter(entity => comparator(getElementId(entity), end))
				           if (filteredEntities.length === rangeItemLimit) {
					           const lastElementId = getElementId(filteredEntities[loadedEntities.length - 1])
					           return this.loadReverseRangeBetween(typeRef, listId, lastElementId, end, rangeItemLimit)
					                      .then(({elements: remainingEntities, loadedCompletely}) => {
						                      return {elements: filteredEntities.concat(remainingEntities), loadedCompletely}
					                      })
				           } else {
					           return {
						           elements: filteredEntities,
						           loadedCompletely: wasReverseRangeCompletelyLoaded(rangeItemLimit, loadedEntities, filteredEntities)
					           }
				           }
			           })
		})

	}

	loadRange<T: ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return this._target.loadRange(typeRef, listId, start, count, reverse)
	}

	/**
	 * load multiple does not guarantee order or completeness of returned elements.
	 */
	loadMultiple<T: SomeEntity>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
		return this._target.loadMultiple(typeRef, listId, elementIds)
	}

	setup<T: SomeEntity>(listId: ?Id, instance: T, extraHeaders?: Params): Promise<Id> {
		return this._target.setup(listId, instance, extraHeaders)
	}

	setupMultipleEntities<T: SomeEntity>(listId: ?Id, instances: Array<T>): Promise<Array<Id>> {
		return this._target.setupMultiple(listId, instances)
	}

	update<T: SomeEntity>(instance: T): Promise<void> {
		return this._target.update(instance)
	}

	erase<T: SomeEntity>(instance: T): Promise<void> {
		return this._target.erase(instance)
	}

	loadVersion<T: SomeEntity>(instance: T, version: Id): Promise<T> {
		return resolveTypeReference((instance: any)._type).then(typeModel => {
			if (!typeModel.versioned) throw new Error("unversioned instance: can't load version")
			return this.load(instance._type, instance._id, {version})
		})
	}

	loadRoot<T: SomeEntity>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		return resolveTypeReference(typeRef).then(typeModel => {
			let rootId = [groupId, typeModel.rootId];
			return this.load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
				return this.load(typeRef, root.reference)
			})
		})
	}
}

function wasReverseRangeCompletelyLoaded<T:ListElementEntity>(rangeItemLimit: number, loadedEntities: Array<T>, filteredEntities: Array<T>): boolean {
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
