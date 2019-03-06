// @flow
import type {HttpMethodEnum, ListElement} from "../common/EntityFunctions"
import {
	_eraseEntity,
	_loadEntity,
	_loadEntityRange,
	_loadMultipleEntities,
	_loadReverseRangeBetween,
	_setupEntity,
	_updateEntity,
	GENERATED_MIN_ID,
	getLetId,
	resolveTypeReference,
	TypeRef
} from "../common/EntityFunctions"
import {_service} from "./rest/ServiceRestClient"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {assertWorkerOrNode} from "../Env"
import {locator} from "./WorkerLocator"

assertWorkerOrNode()

export function setup<T>(listId: ?Id, instance: T, extraHeaders?: Params): Promise<Id> {
	return _setupEntity(listId, instance, locator.cache, extraHeaders)
}

export function update<T>(instance: T): Promise<void> {
	return _updateEntity(instance, locator.cache)
}

export function erase<T>(instance: T): Promise<void> {
	return _eraseEntity(instance, locator.cache)
}

export function load<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, extraHeaders?: Params): Promise<T> {
	return _loadEntity(typeRef, id, queryParams, locator.cache, extraHeaders)
}

export function loadMultiple<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
	return _loadMultipleEntities(typeRef, listId, elementIds, locator.cache)
}

export function loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
	return _loadEntityRange(typeRef, listId, start, count, reverse, locator.cache)
}

//TODO: move version in Entity.js to EntityFunctions and use it from here. Remove this restricted version
export function loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id): Promise<T[]> {
	return _loadAll(typeRef, listId, (start) ? start : GENERATED_MIN_ID)
}

const RANGE_ITEM_LIMIT = 1000

function _loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id): Promise<T[]> {
	return loadRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false).then(elements => {
		if (elements.length === RANGE_ITEM_LIMIT) {
			let lastElementId = getLetId(elements[elements.length - 1])[1]
			return _loadAll(typeRef, listId, lastElementId).then(nextElements => {
				return elements.concat(nextElements)
			})
		} else {
			return Promise.resolve(elements)
		}
	})
}

/**
 * Provides all entities with element ids between start (included) and end (excluded). This function may actually load more elements from the server, but just returns the requested ones.
 */
export function loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id): Promise<T[]> {
	return _loadReverseRangeBetween(typeRef, listId, start, end, locator.cache)
}

export function loadRoot<T>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let rootId = [groupId, typeModel.rootId];
		return load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
			return load(typeRef, root.reference)
		})
	})
}


export function serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<T> {
	return _service(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<void> {
	return _service(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}

export class EntityWorker {
	load<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params): Promise<T> {
		return load(typeRef, id, queryParams)
	}

	loadRoot<T>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
		return loadRoot(typeRef, groupId)
	}

	loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id): Promise<T[]> {
		return loadAll(typeRef, listId, start)
	}

	loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id): Promise<T[]> {
		return loadReverseRangeBetween(typeRef, listId, start, end)
	}

	_loadEntityRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean, target: EntityRestInterface): Promise<T[]> {
		return _loadEntityRange(typeRef, listId, start, count, reverse, target)
	}

	_loadEntity<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, target: EntityRestInterface): Promise<T> {
		return _loadEntity(typeRef, id, queryParams, target)
	}

	loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return loadRange(typeRef, listId, start, count, reverse)
	}

	_loadMultipleEntities<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[], target: EntityRestInterface): Promise<T[]> {
		return _loadMultipleEntities(typeRef, listId, elementIds, target)
	}
}