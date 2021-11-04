// @flow
import type {HttpMethodEnum} from "../common/EntityFunctions"
import {
	_eraseEntity,
	_loadEntity,
	_loadEntityRange,
	_loadMultipleEntities,
	_setupEntity,
	_updateEntity,
	getFirstIdIsBiggerFnForType,
	resolveTypeReference
} from "../common/EntityFunctions"
import type {RootInstance} from "../entities/sys/RootInstance"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {assertMainOrNode} from "../common/Env"
import {ValueType} from "../common/EntityConstants"
import type {Element, ListElement} from "../common/utils/EntityUtils";
import {CUSTOM_MIN_ID, GENERATED_MIN_ID, getLetId, RANGE_ITEM_LIMIT} from "../common/utils/EntityUtils";
import {TypeRef} from "@tutao/tutanota-utils";
import {locator} from "./MainLocator"

assertMainOrNode()

export type SomeEntity = Element | ListElement

/** @deprecated use EntityClient implementation instead */
export function setup<T: SomeEntity>(listId: ?Id, instance: T): Promise<Id> {
	return _setupEntity(listId, instance, locator.worker)
}

/** @deprecated use EntityClient implementation instead */
export function update<T: SomeEntity>(instance: T): Promise<void> {
	return _updateEntity(instance, locator.worker)
}

/** @deprecated use EntityClient implementation instead */
export function erase<T: SomeEntity>(instance: T): Promise<void> {
	return _eraseEntity(instance, locator.worker)
}

/** @deprecated use EntityClient implementation instead */
export function load<T: SomeEntity>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params): Promise<T> {
	return _loadEntity(typeRef, id, queryParams, locator.worker)
}

/**
 * load multiple does not guarantee order or completeness of returned elements.
 * @deprecated use EntityClient implementation instead
 */
export function loadMultiple<T: SomeEntity>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
	return _loadMultipleEntities(typeRef, listId, elementIds, locator.worker)
}

/** @deprecated use EntityClient implementation instead */
export function loadRange<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number,
                                          reverse: boolean): Promise<T[]> {
	return _loadEntityRange(typeRef, listId, start, count, reverse, locator.worker)
}


/** @deprecated use EntityClient implementation instead */
export function loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: ?Id, end: ?Id): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (!start) {
			start = (typeModel.values["_id"].type === ValueType.GeneratedId) ? GENERATED_MIN_ID : CUSTOM_MIN_ID
		}
		return _loadAll(typeRef, listId, start, end)
	})
}

function _loadAll<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: ?Id): Promise<T[]> {
	return resolveTypeReference(typeRef)
		.then(getFirstIdIsBiggerFnForType)
		.then((isFirstIdBigger) => {
			return loadRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false).then(elements => {
				if (elements.length === 0) return Promise.resolve(elements)
				let lastElementId = getLetId(elements[elements.length - 1])[1]
				if (elements.length === RANGE_ITEM_LIMIT && (end == null || isFirstIdBigger(end, lastElementId[1]))) {
					return _loadAll(typeRef, listId, lastElementId, end).then(nextElements => {
						return elements.concat(nextElements)
					})
				} else {
					return Promise.resolve(elements.filter(e => {
						if (end == null) {
							return true // no end element specified return full list
						} else {
							return isFirstIdBigger(end, getLetId(e)[1]) || end === getLetId(e)[1]
						}
					}))
				}
			})
		})
}

export function loadVersion<T>(instance: T, version: Id): Promise<T> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		if (!typeModel.versioned) throw new Error("unversioned instance: can't load version")
		return load((instance: any)._type, (instance: any)._id, {version})
	})
}

/** @deprecated use EntityClient implementation instead */
export function loadRoot<T: SomeEntity>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let rootId = [groupId, typeModel.rootId];
		return load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
			return load(typeRef, root.reference)
		})
	})
}

type Service = SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum

export function serviceRequest<T>(service: Service, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>,
                                  queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<T> {
	return locator.worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(service: Service, method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params,
                                      sk: ?Aes128Key, extraHeaders?: Params): Promise<void> {
	return locator.worker.serviceRequest(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}