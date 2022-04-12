import {EntityRestClient, getIds} from "../../../src/api/worker/rest/EntityRestClient"
import {
	compareNewestFirst,
	compareOldestFirst,
	elementIdPart,
	firstBiggerThanSecond,
	getElementId,
	getListId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../src/api/common/utils/EntityUtils"
import {_verifyType, resolveTypeReference} from "../../../src/api/common/EntityFunctions"
import {NotFoundError} from "../../../src/api/common/error/RestError"
import {downcast, TypeRef} from "@tutao/tutanota-utils"
import type {ElementEntity, ListElementEntity, SomeEntity} from "../../../src/api/common/EntityTypes"
import {InstanceMapper} from "../../../src/api/worker/crypto/InstanceMapper"

export class EntityRestClientMock extends EntityRestClient {
	_entities: Record<Id, ElementEntity | Error> = {}
	_listEntities: Record<Id, Record<Id, ListElementEntity | Error>> = {}
	_lastIdTimestamp: number

	constructor() {
		super(
			{createAuthHeaders: () => ({})},
			downcast({}),
			() => downcast({}),
			new InstanceMapper(),
		)
		this._lastIdTimestamp = Date.now()
	}

	getNextId(): Id {
		this._lastIdTimestamp++
		return timestampToGeneratedId(this._lastIdTimestamp, 1)
	}

	addElementInstances(...instances: Array<ElementEntity>) {
		instances.forEach(instance => (this._entities[instance._id] = instance))
	}

	addListInstances(...instances: Array<ListElementEntity>) {
		instances.forEach(instance => {
			if (!this._listEntities[getListId(instance)]) this._listEntities[getListId(instance)] = {}
			this._listEntities[getListId(instance)][getElementId(instance)] = instance
		})
	}

	setException(id: Id | IdTuple, error: Error) {
		if (typeof id === "string") {
			this._entities[id] = error
		} else {
			if (!this._listEntities[listIdPart(id)]) this._listEntities[listIdPart(id)] = {}
			this._listEntities[listIdPart(id)][elementIdPart(id)] = error
		}
	}

	_getListEntry(listId: Id, elementId: Id): ListElementEntity | null | undefined {
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

	async load<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		id: T["_id"],
		queryParameters: Dict | null | undefined,
		extraHeaders?: Dict,
	): Promise<T> {
		if (id instanceof Array && id.length === 2) {
			// list element request
			const listId = id[0]
			const elementId = id[1]

			const listElement = this._getListEntry(listId, elementId)

			if (listElement == null) throw new NotFoundError(`List element ${listId} ${elementId} not found`)
			return downcast(listElement)
		} else if (typeof id === "string") {
			//element request
			return this._handleMockElement(this._entities[id], id)
		} else {
			throw new Error("Illegal Id for ET: " + (id as any))
		}
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
	): Promise<T[]> {
		let entriesForListId = this._listEntities[listId]
		if (!entriesForListId) return []
		let filteredIds

		if (reverse) {
			filteredIds = Object.keys(entriesForListId)
								.sort(compareNewestFirst)
								.filter(id => firstBiggerThanSecond(start, id))
		} else {
			filteredIds = Object.keys(entriesForListId)
								.sort(compareOldestFirst)
								.filter(id => firstBiggerThanSecond(id, start))
		}

		return filteredIds.map(id => this._handleMockElement(entriesForListId[id], id))
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null | undefined,
		elementIds: Array<Id>,
	): Promise<Array<T>> {
		const lid = listId

		if (lid) {
			return elementIds
				.map(id => {
					return downcast(this._getListEntry(lid, id))
				})
				.filter(Boolean)
		} else {
			return elementIds
				.map(id => {
					try {
						return this._handleMockElement(this._entities[id], id)
					} catch (e) {
						if (e instanceof NotFoundError) {
							return null
						} else {
							throw e
						}
					}
				})
				.filter(Boolean)
		}
	}

	erase<T extends SomeEntity>(instance: T): Promise<void> {
		return resolveTypeReference(instance._type).then(typeModel => {
			_verifyType(typeModel)

			var ids = getIds(instance, typeModel)

			this._handleDelete(ids.id, ids.listId)
		})
	}

	setup<T extends SomeEntity>(listId: Id | null | undefined, instance: T, extraHeaders?: Dict): Promise<Id> {
		return Promise.reject("Illegal method: setup")
	}

	setupMultiple<T extends SomeEntity>(listId: Id | null | undefined, instances: Array<T>): Promise<Array<Id>> {
		return Promise.reject("Illegal method: setupMultiple")
	}

	update<T extends SomeEntity>(instance: T): Promise<void> {
		return Promise.reject("Illegal method: update")
	}

	_handleDelete(id: Id | null | undefined, listId: Id | null | undefined) {
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

	_handleMockElement(element: any, id: Id | IdTuple): any {
		if (element instanceof Error) {
			throw element
		} else if (element != null) {
			return element
		} else {
			throw new NotFoundError(`element with id ${id.toString()} does not exists`)
		}
	}
}