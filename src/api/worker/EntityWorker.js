// @flow
import type {HttpMethodEnum} from "../common/EntityFunctions"
import {
	_setupEntity,
	_updateEntity,
	_eraseEntity,
	_loadEntity,
	_loadMultipleEntities,
	_loadEntityRange,
	resolveTypeReference,
	TypeRef,
	getLetId,
	GENERATED_MIN_ID
} from "../common/EntityFunctions"
import {_service} from "./rest/ServiceRestClient"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {assertWorkerOrNode} from "../Env"
import {locator} from "./WorkerLocator"

assertWorkerOrNode()

export function setup<T>(listId: ?Id, instance: T): Promise<Id> {
	return _setupEntity(listId, instance, locator.cache)
}

export function update<T>(instance: T): Promise<void> {
	return _updateEntity(instance, locator.cache)
}

export function erase<T>(instance: T): Promise<void> {
	return _eraseEntity(instance, locator.cache)
}

export function load<T>(typeRef: TypeRef<T>, id: Id|IdTuple, queryParams: ?Params): Promise<T> {
	return _loadEntity(typeRef, id, queryParams, locator.cache)
}

export function loadMultiple<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
	return _loadMultipleEntities(typeRef, listId, elementIds, locator.cache)
}

export function loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
	return _loadEntityRange(typeRef, listId, start, count, reverse, locator.cache)
}

export function loadAll<T>(typeRef: TypeRef<T>, listId: Id, start: ?Id): Promise<T[]> {
	return _loadAll(typeRef, listId, (start) ? start : GENERATED_MIN_ID)
}

const RANGE_ITEM_LIMIT = 1000
function _loadAll<T>(typeRef: TypeRef<T>, listId: Id, start: Id): Promise<T[]> {
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

export function loadRoot<T>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let rootId = [groupId, typeModel.rootId];
		return load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
			return load(typeRef, root.reference)
		})
	})
}


export function serviceRequest<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>, queryParams: ?Params, sk: ?Aes128Key): Promise<T> {
	return _service(service, method, requestEntity, responseTypeRef, queryParams, sk)
}

export function serviceRequestVoid<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params, sk: ?Aes128Key): Promise<void> {
	return _service(service, method, requestEntity, null, queryParams, sk)
}