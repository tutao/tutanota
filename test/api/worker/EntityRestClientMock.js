//@flow
import {EntityRestClient} from "../../../src/api/worker/rest/EntityRestClient"
import {timestampToGeneratedId} from "../../../src/api/common/utils/Encoding"
import type {Element, HttpMethodEnum, ListElement} from "../../../src/api/common/EntityFunctions"
import {
	compareNewestFirst,
	compareOldestFirst,
	elementIdPart,
	firstBiggerThanSecond,
	getElementId,
	getListId,
	HttpMethod,
	listIdPart,
	resolveTypeReference,
	TypeRef
} from "../../../src/api/common/EntityFunctions"
import {NotFoundError} from "../../../src/api/common/error/RestError"

export class EntityRestClientMock extends EntityRestClient {

	_entities: {[id: Id]: Object} = {}
	_listEntities: {[listId: Id]: {[id: Id]: Object}} = {}
	_lastIdTimestamp: number


	//_listEntities: {[key: string]: {[key: Id]: {allRange: Id[], lowerRangeId: Id, upperRangeId: Id, elements: {[key: Id]: Object}}}};
	constructor() {
		super(() => {
			return {} // empty auth headers
		})
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

	_getListEntry(listId: Id, elementId: Id, throwOnNotFound: boolean = true) {
		try {
			if (!this._listEntities[listId]) {
				throw new NotFoundError("list not set")
			}
			return this._handleMockElement(this._listEntities[listId][elementId])
		} catch (e) {
			if (e instanceof NotFoundError) {
				if (throwOnNotFound) {
					throw e
				} else {
					return null
				}
			} else {
				throw e
			}
		}
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params, extraHeaders?: Params): Promise<any> {
		return resolveTypeReference(typeRef).then(model => {
			const startId = queryParameter && queryParameter["start"]
			const idsParamter = queryParameter && queryParameter["ids"]
			if (method === HttpMethod.GET) {
				if (listId && id) {// single list element request
					return this._getListEntry(listId, id, true)
				} else if (listId && startId) { // list range request
					let entriesForListId = this._listEntities[listId]
					if (!entriesForListId) return []
					let filteredIds
					if (queryParameter && queryParameter.reverse === "true") {
						filteredIds = Object.keys(entriesForListId).sort(compareNewestFirst).filter((id) => firstBiggerThanSecond(startId, id))
					} else {
						filteredIds = Object.keys(entriesForListId).sort(compareOldestFirst).filter((id) => firstBiggerThanSecond(id, startId))
					}
					return filteredIds.map((id) => this._handleMockElement(entriesForListId[id]))
				} else if (id) {// element instance request
					return this._handleMockElement(this._entities[id])
				} else if (idsParamter) {
					const ids = idsParamter.split(",")
					const lid = listId
					if (lid) {
						return ids.map(id => {
							return this._getListEntry(lid, id, false)
						}).filter(Boolean)
					} else {
						return ids.map(id => {
							try {
								return this._handleMockElement(this._entities[id])
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
					return Promise.reject("Illegal method: " + method)
				}
			} else {
				return Promise.reject("Illegal method: " + method)
			}
		})
	}

	_handleMockElement(element: ?Object): Object {
		if (element instanceof Error) {
			throw element
		} else if (element != null) {
			return element
		} else {
			throw new NotFoundError("element with does not exists")
		}
	}
}
