//@flow
import {EntityRestClient} from "../../../src/api/worker/rest/EntityRestClient"
import {timestampToGeneratedId} from "../../../src/api/common/utils/Encoding"
import type {HttpMethodEnum} from "../../../src/api/common/EntityFunctions"
import {
	HttpMethod,
	resolveTypeReference
} from "../../../src/api/common/EntityFunctions"
import {NotFoundError} from "../../../src/api/common/error/RestError"
import {downcast} from "../../../src/api/common/utils/Utils"
import {
	compareNewestFirst,
	compareOldestFirst,
	elementIdPart,
	firstBiggerThanSecond,
	getElementId,
	getListId,
	listIdPart
} from "../../../src/api/common/utils/EntityUtils";
import type {Element, ListElement} from "../../../src/api/common/utils/EntityUtils";
import {TypeRef} from "../../../src/api/common/utils/TypeRef";

export class EntityRestClientMock extends EntityRestClient {

	_entities: {[id: Id]: Object} = {}
	_listEntities: {[listId: Id]: {[id: Id]: Object}} = {}
	_lastIdTimestamp: number

	//_listEntities: {[key: string]: {[key: Id]: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}}};
	constructor() {
		super(() => {
			return {} // empty auth headers
		}, downcast({}))
		this._lastIdTimestamp = Date.now()
	}

	getNextId(): Id {
		this._lastIdTimestamp++
		return timestampToGeneratedId(this._lastIdTimestamp, 1)
	}

	addElementInstances(...instances: Array<Element>) {
		instances.forEach((instance) => this._entities[instance._id] = instance)
	}

	addListInstances(...instances: Array<ListElement>) {
		instances.forEach((instance) => {
			if (!this._listEntities[getListId(instance)]) this._listEntities[getListId(instance)] = {}
			this._listEntities[getListId(instance)][getElementId(instance)] = instance
		})
	}

	setException(id: Id | IdTuple, error: Error) {
		if (Array.isArray(id)) {
			if (!this._listEntities[listIdPart(id)]) this._listEntities[listIdPart(id)] = {}
			this._listEntities[listIdPart(id)][elementIdPart(id)] = error
		} else {
			this._entities[id] = error
		}
	}

	_getListEntry(listId: Id, elementId: Id): ?ListElement {
		if (!this._listEntities[listId]) {
			throw new NotFoundError(`Not list ${listId}`)
		}
		try {
			return this._handleMockElement(this._listEntities[listId][elementId], [listId, elementId])
		} catch (e) {
			if (e instanceof NotFoundError) {
				return null
			} else {
				throw e
			}
		}
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params,
	                 extraHeaders?: Params
	): Promise<any> {
		return resolveTypeReference(typeRef).then(() => {
			const startId = queryParameter && queryParameter["start"]
			const idsParamter = queryParameter && queryParameter["ids"]
			if (method === HttpMethod.GET) {
				return this._handleGet(id, listId, startId, queryParameter, idsParamter)
			} else if (method === HttpMethod.DELETE) {
				this._handleDelete(id, listId)
			} else {
				return Promise.reject("Illegal method: " + method)
			}
		})
	}

	_handleGet(id: ?Id, listId: ?Id, startId: ?Id, queryParameter: ?Params, idsParamter: ?string
	): Element | ListElement | Array<ListElement> {
		if (listId && id) {// single list element request
			const listElement = this._getListEntry(listId, id)
			if (listElement == null) throw new NotFoundError(`List element ${listId} ${id} not found`)
			return listElement
		} else if (listId && startId) { // list range request
			let entriesForListId = this._listEntities[listId]
			if (!entriesForListId) return ([]: Array<ListElement>)
			let filteredIds
			if (queryParameter && queryParameter.reverse === "true") {
				filteredIds = Object.keys(entriesForListId).sort(compareNewestFirst).filter((id) => firstBiggerThanSecond(startId, id))
			} else {
				filteredIds = Object.keys(entriesForListId).sort(compareOldestFirst).filter((id) => firstBiggerThanSecond(id, startId))
			}
			return filteredIds.map((id) => this._handleMockElement(entriesForListId[id], id))
		} else if (id) {// element instance request
			return this._handleMockElement(this._entities[id], id)
		} else if (idsParamter) {
			const ids = idsParamter.split(",")
			const lid = listId
			if (lid) {
				return ids.map(id => {
					return this._getListEntry(lid, id)
				}).filter(Boolean)
			} else {
				return ids.map(id => {
					try {
						return this._handleMockElement(this._entities[id], id)
					} catch (e) {
						if (e instanceof NotFoundError) {
							return null
						} else {
							throw e
						}
					}
				}).filter(Boolean)
			}
		} else {
			throw new Error("Invalid arguments for GET: no id passed")
		}
	}

	_handleDelete(id: ?Id, listId: ?Id) {
		if (id && listId) {
			if (this._getListEntry(listId, id)) {
				delete this._listEntities[listId][id]
			} else {
				throw new NotFoundError(`List element ${listId} ${id} not found`)
			}
		} else if (id) {
			if (this._entities[id]) {
				delete this._listEntities[id]
			} else {
				throw new NotFoundError(`Element ${id} not found`)
			}
		} else {
			throw new Error("Illegal arguments for DELETE")
		}
	}

	_handleMockElement<T: Element | ListElement>(element: ?T | Error, id: Id | IdTuple): T {
		if (element instanceof Error) {
			throw element
		} else if (element != null) {
			return element
		} else {
			throw new NotFoundError(`element with id ${id.toString()} does not exists`)
		}
	}
}
