// @flow
// $FlowIgnore[untyped-import]
import {Type, ValueType} from "./EntityConstants"
import {last} from "./utils/ArrayUtils"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import sysModelMap from "../entities/sys/sysModelMap"
import tutanotaModelMap from "../entities/tutanota/tutanotaModelMap"
import monitorModelMap from "../entities/monitor/monitorModelMap"
import type {ListElement} from "./utils/EntityUtils"
import {customIdToString, firstBiggerThanSecond, getElementId, LOAD_MULTIPLE_LIMIT} from "./utils/EntityUtils"
import accountingModelMap from "../entities/accounting/accountingModelMap"
import baseModelMap from "../entities/base/baseModelMap"
import gossipModelMap from "../entities/gossip/gossipModelMap"
import {TypeRef} from "./utils/TypeRef";
import storageModelMap from "../entities/storage/storageModelMap"


export const HttpMethod = Object.freeze({
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE'
})
export type HttpMethodEnum = $Values<typeof HttpMethod>;

export const MediaType = Object.freeze({
	Json: 'application/json',
	Binary: 'application/octet-stream',
	Text: 'text/plain',
})
export type MediaTypeEnum = $Values<typeof MediaType>;

/**
 * Model maps are needed for static analysis and dead-code elimination.
 * We access most types through the TypeRef but also sometimes we include them completely dynamically (e.g. encryption of aggregates).
 * This means that we need to tell our bundler which ones do exist so that they are included.
 */
const modelMaps = {
	base: baseModelMap,
	sys: sysModelMap,
	tutanota: tutanotaModelMap,
	monitor: monitorModelMap,
	accounting: accountingModelMap,
	gossip: gossipModelMap,
	storage: storageModelMap
}

export function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	const modelMap = modelMaps[typeRef.app]

	if (modelMap[typeRef.type] == null) {
		return Promise.reject(new Error("Cannot find TypeRef: " + JSON.stringify(typeRef)))
	} else {
		// Wrap in Bluebird promise
		return Promise.resolve(modelMap[typeRef.type]())
		              .then(module => {
			              return module._TypeModel
		              })
	}
}


export function _setupEntity<T>(listId: ?Id, instance: T, target: EntityRestInterface, extraHeaders?: Params): Promise<Id> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}
		return target.entityRequest((instance: any)._type, HttpMethod.POST, listId, null, instance, null, extraHeaders).then(val => {
			return ((val: any): Id)
		})
	})
}

export function _updateEntity<T>(instance: T, target: EntityRestInterface): Promise<void> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		if (!(instance: any)._id) throw new Error("Id must be defined")
		var ids = _getIds(instance, typeModel)
		return target.entityRequest((instance: any)._type, HttpMethod.PUT, ids.listId, ids.id, instance).return()
	})
}

export function _eraseEntity<T>(instance: T, target: EntityRestInterface): Promise<void> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		var ids = _getIds(instance, typeModel)
		return target.entityRequest((instance: any)._type, HttpMethod.DELETE, ids.listId, ids.id).return()
	})
}

export function _loadEntity<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, target: EntityRestInterface, extraHeaders?: Params): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		_verifyType(typeModel)
		let listId = null
		let elementId = null
		if (typeModel.type === Type.ListElement) {
			if ((!(id instanceof Array) || id.length !== 2)) {
				throw new Error("Illegal IdTuple for LET: " + (id: any))
			}
			listId = id[0]
			elementId = id[1]
		} else if (typeof id === "string") {
			elementId = id
		} else {
			throw new Error("Illegal Id for ET: " + (id: any))
		}
		return target.entityRequest(typeRef, HttpMethod.GET, listId, elementId, null, queryParams, extraHeaders).then((val) => {
			return ((val: any): T)
		})
	})
}


/**
 * load multiple does not guarantee order or completeness of returned elements.
 */
export function _loadMultipleEntities<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[], target: EntityRestInterface, extraHeaders?: Params): Promise<T[]> {
	// split the ids into chunks
	let idChunks = [];
	for (let i = 0; i < elementIds.length; i += LOAD_MULTIPLE_LIMIT) {
		idChunks.push(elementIds.slice(i, i + LOAD_MULTIPLE_LIMIT))
	}
	return resolveTypeReference(typeRef).then(typeModel => {
		_verifyType(typeModel)
		return Promise.map(idChunks, idChunk => {
			let queryParams = {
				ids: idChunk.join(",")
			}
			return (target.entityRequest(typeRef, HttpMethod.GET, listId, null, null, queryParams, extraHeaders): any)
		}, {concurrency: 1}).then(instanceChunks => {
			return Array.prototype.concat.apply([], instanceChunks);
		})
	})
}

export function _loadEntityRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean, target: EntityRestInterface,
                                    extraHeaders?: Params): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		let queryParams = {
			start: start + "",
			count: count + "",
			reverse: reverse.toString()
		}
		return (target.entityRequest(typeRef, HttpMethod.GET, listId, null, null, queryParams, extraHeaders): any)
	})
}

export function firstCustomIdIsBigger(left: Id, right: Id): boolean {
	return firstBiggerThanSecond(customIdToString(left), customIdToString(right))
}

/**
 * Return appropriate id sorting function for typeModel.
 *
 * For generated IDs we use base64ext which is sortable. For custom IDs we use base64url which is not sortable.
 *
 * Important: works only with custom IDs which are derived from strings.
 *
 * @param typeModel
 * @return {(function(string, string): boolean)}
 */
export function getFirstIdIsBiggerFnForType(typeModel: TypeModel): ((Id, Id) => boolean) {
	if (typeModel.values["_id"].type === ValueType.CustomId) {
		return firstCustomIdIsBigger
	} else {
		return firstBiggerThanSecond
	}
}

export function _loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id, target: EntityRestInterface,
                                                         rangeItemLimit: number, extraHeaders?: Params): Promise<{elements: T[], loadedCompletely: boolean}> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		return _loadEntityRange(typeRef, listId, start, rangeItemLimit, true, target, extraHeaders)
			.then(loadedEntities => {
				const comparator = getFirstIdIsBiggerFnForType(typeModel)
				const filteredEntities = loadedEntities.filter(entity => comparator(getElementId(entity), end))
				if (filteredEntities.length === rangeItemLimit) {
					const lastElementId = getElementId(filteredEntities[loadedEntities.length - 1])
					return _loadReverseRangeBetween(typeRef, listId, lastElementId, end, target, rangeItemLimit, extraHeaders)
						.then(({elements: remainingEntities, loadedCompletely}) => {
							return {elements: filteredEntities.concat(remainingEntities), loadedCompletely}
						})
				} else {
					return {
						elements: filteredEntities,
						loadedCompletely: loadedReverseRangeCompletely(rangeItemLimit, loadedEntities, filteredEntities)
					}
				}
			})
	})
}

function loadedReverseRangeCompletely<T:ListElement>(rangeItemLimit: number, loadedEntities: Array<T>, filteredEntities: Array<T>): boolean {
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

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type
		!== Type.ListElement) {
		throw new Error("only Element and ListElement types are permitted, was: "
			+ typeModel.type)
	}
}

function _getIds(instance: any, typeModel) {
	if (!instance._id) throw new Error("Id must be defined")
	let listId = null
	let id = null
	if (typeModel.type === Type.ListElement) {
		listId = instance._id[0]
		id = instance._id[1]
	} else {
		id = instance._id
	}
	return {listId: listId, id: id};
}