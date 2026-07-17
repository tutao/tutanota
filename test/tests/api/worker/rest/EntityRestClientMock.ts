import {
	AnyEntityId,
	BlobElementEntity,
	clone,
	compareNewestFirst,
	compareOldestFirst,
	ElementEntity,
	elementIdPart,
	elementIdToId,
	firstBiggerThanSecond,
	getIdOfInstance,
	getServerIdEncodingForType,
	idToElementId,
	isSameId,
	isSameTypeRef,
	ListElementEntity,
	listIdPart,
	PersistentEntity,
	stringifyId,
	timestampToGeneratedId,
	Type,
	TypeRef,
} from "../../../../../src/platform-kit/meta"
import { ensureIsPersistentType, LoggedInUserProvider, TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import * as restError from "../../../../../src/platform-kit/rest-client/error"
import { assertNotNull, downcast, isNotNull, Nullable } from "../../../../../src/platform-kit/utils"
import { clientInitializedTypeModelResolver, IdGenerator, instancePipelineFromTypeModelResolver } from "../../../TestUtils"
import { EntityRestClient } from "../../../../../src/platform-kit/network/EntityRestClient"
import { object } from "testdouble"
import { SymmetricEncryptionScheme } from "../../../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS, EntityRestClientLoadOptions } from "../../../../../src/platform-kit/instance-pipeline/RestClientOptions"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"

const authDataProvider: LoggedInUserProvider = downcast({
	createAuthHeaders(): Dict {
		return {}
	},
	isFullyLoggedIn(): boolean {
		return true
	},
	getDefaultSymmetricEncryptionScheme(): SymmetricEncryptionScheme {
		return SymmetricEncryptionScheme.AesCbc
	},
})

type TypeRefString = string
export class EntityRestClientMock extends EntityRestClient {
	_entities: Record<TypeRefString, Record<Id, ElementEntity | Error>> = {}
	_listEntities: Record<TypeRefString, Record<Id, Record<Id, ListElementEntity | BlobElementEntity | Error>>> = {}
	_lastIdTimestamp: number
	private _typeModelResolver: TypeModelResolver
	private updatedInstances: PersistentEntity[] = []
	private createdInstances: PersistentEntity[] = []
	private idGenerator = new IdGenerator(timestampToGeneratedId(1))

	constructor() {
		const typeModelResolver = clientInitializedTypeModelResolver()
		super(
			authDataProvider,
			downcast({}),
			() => downcast({}),
			instancePipelineFromTypeModelResolver(typeModelResolver),
			downcast({}),
			typeModelResolver,
			() => downcast({}),
			object(),
		)
		this._lastIdTimestamp = Date.now()
		this._typeModelResolver = typeModelResolver
	}

	getNextId(): Id {
		this._lastIdTimestamp++
		return timestampToGeneratedId(this._lastIdTimestamp, 1)
	}

	addElementInstances(...instances: Array<ElementEntity>) {
		for (const instance of instances) {
			const typeRefString = instance._type.toString()
			if (this._entities[typeRefString] == null) this._entities[typeRefString] = {}
			this._entities[typeRefString][elementIdToId(instance._id)] = instance
		}
	}

	addListInstances(...instances: Array<ListElementEntity>) {
		for (const instance of instances) {
			const typeRefString = instance._type.toString()
			const listId = listIdPart(instance._id)
			if (!this._listEntities[typeRefString]) this._listEntities[typeRefString] = {}
			if (!this._listEntities[typeRefString][listId]) this._listEntities[typeRefString][listId] = {}
			this._listEntities[typeRefString][listId][elementIdPart(instance._id)] = instance
		}
	}

	addBlobInstances(...instances: Array<BlobElementEntity>) {
		return this.addListInstances(...instances)
	}

	setListElementException(typeRef: TypeRef<ListElementEntity>, id: IdTuple, error: Error) {
		const typeRefString = typeRef.toString()
		if (!this._listEntities[typeRefString]) this._listEntities[typeRefString] = {}
		if (!this._listEntities[typeRefString][listIdPart(id)]) this._listEntities[typeRefString][listIdPart(id)] = {}
		this._listEntities[typeRefString][listIdPart(id)][elementIdPart(id)] = error
	}

	setBlobElementException(typeRef: TypeRef<BlobElementEntity>, id: IdTuple, error: Error) {
		this.setListElementException(typeRef, id, error)
	}

	_getListEntry(typeRef: TypeRef<ListElementEntity>, listId: Id, elementId: Id): ListElementEntity | null | undefined {
		const typeRefString = typeRef.toString()
		if (this._listEntities[typeRefString] == null || this._listEntities[typeRefString][listId] == null) {
			throw new restError.NotFoundError(`Not list ${typeRefString}/${listId}`)
		}
		try {
			return this._handleMockElement(this._listEntities[typeRefString][listId][elementId], [listId, elementId])
		} catch (e) {
			if (e instanceof restError.NotFoundError) {
				return null
			} else {
				throw e
			}
		}
	}

	async load<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		id: T["_id"],
		_opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<T> {
		const [listId, elementId] = id
		if (isNotNull(listId)) {
			const listElement = this._getListEntry(typeRef as TypeRef<ListElementEntity>, listId, elementId)

			if (listElement == null) {
				throw new restError.NotFoundError(`List element ${listId} ${elementId} not found`)
			}
			return downcast<T>(listElement)
		} else {
			//element request
			return this._handleMockElement(this._entities[typeRef.toString()][elementIdToId(id)], id)
		}
	}

	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const entriesForListId = (this._listEntities[typeRef.toString()] ?? {})[listId] ?? {}
		let filteredIds: Array<Id>

		const typeModel = await this._typeModelResolver.resolveClientTypeReference(typeRef)
		const idEncoding = getServerIdEncodingForType(typeModel)

		if (reverse) {
			filteredIds = Object.keys(entriesForListId)
				.sort((a, b) => compareNewestFirst(a, b, idEncoding))
				.filter((id) => firstBiggerThanSecond(start, id, idEncoding))
		} else {
			filteredIds = Object.keys(entriesForListId)
				.sort((a, b) => compareOldestFirst(a, b, idEncoding))
				.filter((id) => firstBiggerThanSecond(id, start, idEncoding))
		}

		return filteredIds.map((id) => this._handleMockElement(entriesForListId[id], idToElementId(id)))
	}

	async loadMultiple<T extends PersistentEntity>(typeRef: TypeRef<T>, listId: Id | null | undefined, elementIds: Array<Id>): Promise<Array<T>> {
		const lid = listId
		const typeModel = await this._typeModelResolver.resolveClientTypeReference(typeRef)

		switch (typeModel.type) {
			case Type.Element: {
				const entities = this._entities[typeRef.toString()] ?? {}
				return elementIds
					.map((id) => {
						try {
							return this._handleMockElement(entities[id], idToElementId(id))
						} catch (e) {
							if (e instanceof restError.NotFoundError) {
								return null
							} else {
								throw e
							}
						}
					})
					.filter(isNotNull)
			}
			case Type.BlobElement:
			case Type.ListElement: {
				return elementIds.map((id) => downcast<T>(this._getListEntry(typeRef as TypeRef<ListElementEntity>, assertNotNull(lid), id))).filter(isNotNull)
			}
			case Type.Aggregated:
			case Type.DataTransfer: {
				throw new ProgrammingError("aggregated/dataTransfer are not to be requested")
			}
		}
	}

	async erase<T extends PersistentEntity>(instance: T): Promise<void> {
		const typeModel = await this._typeModelResolver.resolveClientTypeReference(instance._type)
		ensureIsPersistentType(typeModel)

		const ids = getIdOfInstance(instance, typeModel)

		this._handleDelete(instance._type, ids.id, ids.listId)
		return Promise.resolve()
	}

	async eraseMultiple<T extends PersistentEntity>(listId: Id, instances: Array<T>): Promise<void> {
		if (instances.length === 0) {
			return
		}

		const typeModel = await this._typeModelResolver.resolveClientTypeReference(instances[0]._type)
		ensureIsPersistentType(typeModel)

		this._handleDeleteMultiple(
			instances.map((it) => getIdOfInstance(it, typeModel).id),
			listId,
		)
		return Promise.resolve()
	}

	async setup<T extends PersistentEntity>(listId: Nullable<Id>, instance: T, extraHeaders: Nullable<Dict>): Promise<Id> {
		const populatedInstance = clone(instance)
		const elementId = this.idGenerator.getNext()
		populatedInstance._id = [listId, elementId]
		this.createdInstances.push(populatedInstance)
		return elementId
	}

	getCreatedInstance<T extends PersistentEntity>(type: TypeRef<T>): T {
		const createdInstance = this.createdInstances.findLast((updated) => isSameTypeRef(type, updated._type))
		if (createdInstance == null) {
			throw new Error(`Did not find created instance for ${type}`)
		}
		return createdInstance as T
	}

	setupMultiple<T extends PersistentEntity>(listId: Id | null | undefined, instances: Array<T>): Promise<Array<Id>> {
		return Promise.reject("Illegal method: setupMultiple")
	}

	async update<T extends PersistentEntity>(instance: T): Promise<void> {
		this.updatedInstances.push(clone(instance))
	}

	getUpdatedInstance<T extends PersistentEntity>(instance: T): T {
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

	_handleDelete(typeRef: TypeRef<PersistentEntity>, id: Id | null | undefined, listId: Id | null | undefined) {
		if (id && listId) {
			if (this._getListEntry(typeRef as TypeRef<ListElementEntity>, listId, id)) {
				delete this._listEntities[typeRef.toString()][listId][id]
			} else {
				throw new restError.NotFoundError(`List element ${listId} ${id} not found`)
			}
		} else if (id) {
			if (this._entities[typeRef.toString()] == null || this._entities[typeRef.toString()][id] == null) {
				throw new restError.NotFoundError(`Element ${id} not found`)
			}
			delete this._entities[typeRef.toString()][id]
		} else {
			throw new Error("Illegal arguments for DELETE")
		}
	}

	_handleMockElement(element: any, id: AnyEntityId): any {
		if (element instanceof Error) {
			throw element
		} else if (element != null) {
			return element
		} else {
			throw new restError.NotFoundError(`element with id ${stringifyId(id)} does not exists`)
		}
	}
}
