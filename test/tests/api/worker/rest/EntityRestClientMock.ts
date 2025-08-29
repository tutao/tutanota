import { EntityRestClient, EntityRestClientLoadOptions } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import {
	compareNewestFirst,
	compareOldestFirst,
	elementIdPart,
	firstBiggerThanSecond,
	getElementId,
	getListId,
	isSameId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { _verifyType, TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions.js"
import { NotFoundError } from "../../../../../src/common/api/common/error/RestError.js"
import { clone, downcast, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import type { BlobElementEntity, ElementEntity, ListElementEntity, SomeEntity } from "../../../../../src/common/api/common/EntityTypes.js"
import { AuthDataProvider } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { Type } from "../../../../../src/common/api/common/EntityConstants.js"
import { clientInitializedTypeModelResolver, IdGenerator, instancePipelineFromTypeModelResolver } from "../../../TestUtils"
import { getIds } from "../../../../../src/common/api/worker/rest/RestClientIdUtils"

const authDataProvider: AuthDataProvider = {
	createAuthHeaders(): Dict {
		return {}
	},
	isFullyLoggedIn(): boolean {
		return true
	},
}

export class EntityRestClientMock extends EntityRestClient {
	_entities: Record<Id, ElementEntity | Error> = {}
	_listEntities: Record<Id, Record<Id, ListElementEntity | Error>> = {}
	_blobEntities: Record<Id, Record<Id, BlobElementEntity | Error>> = {}
	_lastIdTimestamp: number
	private _typeModelResolver: TypeModelResolver
	private updatedInstances: SomeEntity[] = []
	private createdInstances: SomeEntity[] = []
	private idGenerator = new IdGenerator(timestampToGeneratedId(1))

	constructor() {
		const typeModelResolver = clientInitializedTypeModelResolver()
		super(authDataProvider, downcast({}), () => downcast({}), instancePipelineFromTypeModelResolver(typeModelResolver), downcast({}), typeModelResolver)
		this._lastIdTimestamp = Date.now()
		this._typeModelResolver = typeModelResolver
	}

	getNextId(): Id {
		this._lastIdTimestamp++
		return timestampToGeneratedId(this._lastIdTimestamp, 1)
	}

	addElementInstances(...instances: Array<ElementEntity>) {
		for (const instance of instances) this._entities[instance._id] = instance
	}

	addListInstances(...instances: Array<ListElementEntity>) {
		for (const instance of instances) {
			if (!this._listEntities[getListId(instance)]) this._listEntities[getListId(instance)] = {}
			this._listEntities[getListId(instance)][getElementId(instance)] = instance
		}
	}

	addBlobInstances(...instances: Array<BlobElementEntity>) {
		for (const instance of instances) {
			if (!this._blobEntities[getListId(instance)]) this._blobEntities[getListId(instance)] = {}
			this._blobEntities[getListId(instance)][getElementId(instance)] = instance
		}
	}

	setElementException(id: Id, error: Error) {
		this._entities[id] = error
	}

	setListElementException(id: IdTuple, error: Error) {
		if (!this._listEntities[listIdPart(id)]) this._listEntities[listIdPart(id)] = {}
		this._listEntities[listIdPart(id)][elementIdPart(id)] = error
	}

	setBlobElementException(id: IdTuple, error: Error) {
		if (!this._blobEntities[listIdPart(id)]) this._blobEntities[listIdPart(id)] = {}
		this._blobEntities[listIdPart(id)][elementIdPart(id)] = error
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

	_getBlobEntry(listId: Id, elementId: Id): ListElementEntity | null | undefined {
		if (!this._blobEntities[listId]) {
			throw new NotFoundError(`Not list ${listId}`)
		}
		try {
			return this._handleMockElement(this._blobEntities[listId][elementId], [listId, elementId])
		} catch (e) {
			if (e instanceof NotFoundError) {
				return null
			} else {
				throw e
			}
		}
	}

	async load<T extends SomeEntity>(_typeRef: TypeRef<T>, id: T["_id"], _opts: EntityRestClientLoadOptions = {}): Promise<T> {
		if (id instanceof Array && id.length === 2) {
			// list element request
			const listId = id[0]
			const elementId = id[1]

			const listElement = this._getListEntry(listId, elementId)

			if (listElement == null) {
				throw new NotFoundError(`List element ${listId} ${elementId} not found`)
			}
			return downcast(listElement)
		} else if (typeof id === "string") {
			//element request
			return this._handleMockElement(this._entities[id], id)
		} else {
			throw new Error("Illegal Id for ET: " + (id as any))
		}
	}

	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		let entriesForListId = this._listEntities[listId]
		if (!entriesForListId) return []
		let filteredIds

		if (reverse) {
			filteredIds = Object.keys(entriesForListId)
				.sort(compareNewestFirst)
				.filter((id) => firstBiggerThanSecond(start, id))
		} else {
			filteredIds = Object.keys(entriesForListId)
				.sort(compareOldestFirst)
				.filter((id) => firstBiggerThanSecond(id, start))
		}

		return filteredIds.map((id) => this._handleMockElement(entriesForListId[id], id))
	}

	async loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null | undefined, elementIds: Array<Id>): Promise<Array<T>> {
		const lid = listId

		if (lid) {
			const typeModule = await this._typeModelResolver.resolveClientTypeReference(typeRef)
			if (typeModule.type === Type.ListElement.valueOf()) {
				return elementIds
					.map((id) => {
						return downcast(this._getListEntry(lid, id))
					})
					.filter(Boolean)
			} else {
				return elementIds
					.map((id) => {
						return downcast(this._getBlobEntry(lid, id))
					})
					.filter(Boolean)
			}
		} else {
			return elementIds
				.map((id) => {
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

	async erase<T extends SomeEntity>(instance: T): Promise<void> {
		const typeModel = await this._typeModelResolver.resolveClientTypeReference(instance._type)
		_verifyType(typeModel)

		const ids = getIds(instance, typeModel)

		this._handleDelete(ids.id, ids.listId)
		return Promise.resolve()
	}

	async eraseMultiple<T extends SomeEntity>(listId: Id, instances: Array<T>): Promise<void> {
		if (instances.length === 0) {
			return
		}

		const typeModel = await this._typeModelResolver.resolveClientTypeReference(instances[0]._type)
		_verifyType(typeModel)

		this._handleDeleteMultiple(
			instances.map((it) => getIds(it, typeModel).id),
			listId,
		)
		return Promise.resolve()
	}

	async setup<T extends SomeEntity>(listId: Id | null | undefined, instance: T, extraHeaders?: Dict): Promise<Id> {
		const populatedInstance = clone(instance)
		const elementId = this.idGenerator.getNext()
		populatedInstance._id = listId == null ? elementId : [listId, elementId]
		this.createdInstances.push(populatedInstance)
		return elementId
	}

	getCreatedInstance<T extends SomeEntity>(type: TypeRef<T>): T {
		const createdInstance = this.createdInstances.findLast((updated) => isSameTypeRef(type, updated._type))
		if (createdInstance == null) {
			throw new Error(`Did not find created instance for ${type}`)
		}
		return createdInstance as T
	}

	setupMultiple<T extends SomeEntity>(listId: Id | null | undefined, instances: Array<T>): Promise<Array<Id>> {
		return Promise.reject("Illegal method: setupMultiple")
	}

	async update<T extends SomeEntity>(instance: T): Promise<void> {
		this.updatedInstances.push(clone(instance))
	}

	getUpdatedInstance<T extends SomeEntity>(instance: T): T {
		const updatedInstance = this.updatedInstances.findLast((updated) => isSameTypeRef(instance._type, updated._type) && isSameId(instance._id, updated._id))
		if (updatedInstance == null) {
			throw new Error(`Did not find updated instance for ${instance._type} ${instance._id}`)
		}
		return updatedInstance as T
	}

	_handleDeleteMultiple(ids: Array<Id>, listId: Id) {
		for (const id of ids) {
			delete this._listEntities[listId][id]
		}
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
