// @flow
import type {HttpMethodEnum} from "../common/EntityFunctions"
import {
	_eraseEntity,
	_loadEntity,
	_loadEntityRange,
	_loadMultipleEntities,
	_setupEntity,
	_updateEntity
} from "../common/EntityFunctions"
import {_service} from "./rest/ServiceRestClient"
import {assertWorkerOrNode} from "../common/Env"
import {locator} from "./WorkerLocator"
import {TypeRef} from "../common/utils/TypeRef";

assertWorkerOrNode()

/** @deprecated use EntityClient.setup instead */
export function setup<T>(listId: ?Id, instance: T, extraHeaders?: Params): Promise<Id> {
	return _setupEntity(listId, instance, locator.cache, extraHeaders)
}

/** @deprecated use EntityClient.update instead */
export function update<T>(instance: T): Promise<void> {
	return _updateEntity(instance, locator.cache)
}

/** @deprecated use EntityClient.erase instead */
export function erase<T>(instance: T): Promise<void> {
	return _eraseEntity(instance, locator.cache)
}

/** @deprecated use EntityClient.load instead */
export function load<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, extraHeaders?: Params): Promise<T> {
	return _loadEntity(typeRef, id, queryParams, locator.cache, extraHeaders)
}


/**
 * load multiple does not guarantee order or completeness of returned elements.
 */
export function loadMultiple<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
	return _loadMultipleEntities(typeRef, listId, elementIds, locator.cache)
}

export function loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
	return _loadEntityRange(typeRef, listId, start, count, reverse, locator.cache)
}

export function serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<T> {
	return _service(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum,
                                      method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<void> {
	return _service(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}
