// @flow

import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {RootInstance} from "../entities/sys/RootInstance"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {
	_eraseEntity,
	_loadEntity,
	_loadEntityRange,
	_loadMultipleEntities,
	_loadReverseRangeBetween,
	_setupEntity,
	_updateEntity,
	resolveTypeReference
} from "./EntityFunctions"
import {CUSTOM_MIN_ID, GENERATED_MIN_ID, getLetId, RANGE_ITEM_LIMIT} from "./utils/EntityUtils";
import type {ListElement} from "./utils/EntityUtils";
// $FlowIgnore[untyped-import]
import {ValueType} from "./EntityConstants"
import {TypeRef} from "./utils/TypeRef";

function _loadRoot<T>(typeRef: TypeRef<T>, groupId: Id, target: EntityRestInterface): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let rootId = [groupId, typeModel.rootId];
		return _loadEntity(RootInstanceTypeRef, rootId, null, target).then((root: RootInstance) => {
			return _loadEntity(typeRef, root.reference, null, target)
		})
	})
}


function _loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id, target: EntityRestInterface): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (!start) {
			start = (typeModel.values["_id"].type === ValueType.GeneratedId) ? GENERATED_MIN_ID : CUSTOM_MIN_ID
		}
		return _loadEntityRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false, target).then(elements => {
			if (elements.length === RANGE_ITEM_LIMIT) {
				let lastElementId = getLetId(elements[elements.length - 1])[1]
				return _loadAll(typeRef, listId, lastElementId, target).then(nextElements => {
					return elements.concat(nextElements)
				})
			} else {
				return Promise.resolve(elements)
			}
		})
	})
}

export class EntityClient {
	_target: EntityRestInterface;

	constructor(target: EntityRestInterface) {
		this._target = target
	}

	load<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, extraHeaders?: Params): Promise<T> {
		return _loadEntity(typeRef, id, queryParams, this._target, extraHeaders)
	}

	setup<T>(listId: ?Id, instance: T): Promise<Id> {
		return _setupEntity(listId, instance, this._target)
	}

	update<T>(instance: T): Promise<void> {
		return _updateEntity(instance, this._target)
	}

	erase<T>(instance: T): Promise<void> {
		return _eraseEntity(instance, this._target)
	}

	loadRoot<T>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		return _loadRoot(typeRef, groupId, this._target)
	}

	loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id): Promise<T[]> {
		return _loadAll(typeRef, listId, start, this._target)
	}

	loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id, rangeItemLimit: number = RANGE_ITEM_LIMIT): Promise<{elements: T[], loadedCompletely: boolean}> {
		return _loadReverseRangeBetween(typeRef, listId, start, end, this._target, rangeItemLimit)
	}

	loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return _loadEntityRange(typeRef, listId, start, count, reverse, this._target)
	}

	/**
	 * load multiple does not guarantee order or completeness of returned elements.
	 */
	loadMultipleEntities<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
		return _loadMultipleEntities(typeRef, listId, elementIds, this._target)
	}
}