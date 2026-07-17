import {
	BlobElementEntity,
	elementIdPart,
	Entity,
	expandId,
	firstBiggerThanSecondBase64Ext,
	getTypeString,
	idToElementId,
	ListElementEntity,
	listIdPart,
	localToServerIdEncoding,
	parseTypeString,
	PersistentEntity,
	serverToLocalIdEncoding,
	Type as TypeId,
	TypeModel,
	TypeRef,
} from "../../platform-kit/meta"
import { assertNotNull, filterNull, getFromMap, Nullable, remove } from "@tutao/utils"
import { CustomCacheHandlerMap } from "./CustomCacheHandler.js"
import { ProgrammingError } from "@tutao/app-env"
import { DecryptedParsedInstance, ModelMapper, ServerTypeModelResolver } from "../../platform-kit/instance-pipeline"
import { CacheStorage, LastUpdateTime } from "./CacheStorage"

import { EphemeralStorageArgs } from "../../platform-kit/base/facades/CacheStorageLateInitializer"

/** Cache for a single list. */
type ListCache = {
	/** All entities loaded inside the range. */
	allRange: Id[]
	lowerRangeId: Id
	upperRangeId: Id
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, DecryptedParsedInstance>
}

/** Map from list id to list cache. */
type ListTypeCache = Map<Id, ListCache>

type BlobElementCache = {
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, DecryptedParsedInstance>
}

/** Map from list id to list cache. */
type BlobElementTypeCache = Map<Id, BlobElementCache>

export class EphemeralCacheStorage implements CacheStorage {
	/** Path to id to entity map. */
	private readonly entities: Map<string, Map<Id, DecryptedParsedInstance>> = new Map()
	private readonly lists: Map<string, ListTypeCache> = new Map()
	private readonly blobEntities: Map<string, BlobElementTypeCache> = new Map()
	private lastUpdateTime: number | null = null
	private userId: Id | null = null
	private lastBatchIdPerGroup = new Map<Id, Id>()
	constructor(
		private readonly modelMapper: ModelMapper,
		private readonly typeModelResolver: ServerTypeModelResolver,
		private readonly customCacheHandlerMap: CustomCacheHandlerMap,
	) {}

	isInitialized(): boolean {
		return this.userId != null
	}

	init({ userId }: EphemeralStorageArgs) {
		this.userId = userId
	}

	async deinit(): Promise<void> {
		this.userId = null
		this.entities.clear()
		this.lists.clear()
		this.blobEntities.clear()
		this.lastUpdateTime = null
		this.lastBatchIdPerGroup.clear()
	}

	/**
	 * Get a given entity from the cache, expects that you have already checked for existence
	 */
	async getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<DecryptedParsedInstance | null> {
		// We downcast because we can't prove that map has correct entity on the type level
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		id = serverToLocalIdEncoding(typeModel, id)
		switch (typeModel.type) {
			case TypeId.Element:
				return this.entities.get(type)?.get(id)?.clone() ?? null
			case TypeId.ListElement:
				return this.lists.get(type)?.get(assertNotNull(listId))?.elements.get(id)?.clone() ?? null
			case TypeId.BlobElement:
				return this.blobEntities.get(type)?.get(assertNotNull(listId))?.elements.get(id)?.clone() ?? null
			case TypeId.DataTransfer:
			case TypeId.Aggregated:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	async provideFromRangeParsed(
		typeRef: TypeRef<unknown>,
		listId: string,
		startElementId: string,
		count: number,
		reverse: boolean,
	): Promise<DecryptedParsedInstance[]> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		startElementId = serverToLocalIdEncoding(typeModel, startElementId)

		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		let range = listCache.allRange
		let ids: Id[]
		if (reverse) {
			let i
			for (i = range.length - 1; i >= 0; i--) {
				if (firstBiggerThanSecondBase64Ext(startElementId, range[i])) {
					break
				}
			}
			if (i >= 0) {
				let startIndex = i + 1 - count
				if (startIndex < 0) {
					// startElementId index may be negative if more elements have been requested than available when getting elements reverse.
					startIndex = 0
				}
				ids = range.slice(startIndex, i + 1)
				ids.reverse()
			} else {
				ids = []
			}
		} else {
			const i = range.findIndex((id) => firstBiggerThanSecondBase64Ext(id, startElementId))
			ids = range.slice(i, i + count)
		}
		let result = new Array<DecryptedParsedInstance>()
		for (let a = 0; a < ids.length; a++) {
			const cachedInstance = listCache.elements.get(ids[a])
			if (cachedInstance != null) {
				const clonedInstance = cachedInstance.clone()
				result.push(clonedInstance)
			}
		}
		return result
	}

	async provideMultipleParsed(typeRef: TypeRef<unknown>, listId: Nullable<string>, elementIds: string[]): Promise<Array<DecryptedParsedInstance>> {
		const result = await Promise.all(
			elementIds.map((elementId) => {
				return this.getParsed(typeRef, listId, elementId)
			}),
		)
		return filterNull(result)
	}

	async getWholeListParsed(typeRef: TypeRef<unknown>, listId: string): Promise<Array<DecryptedParsedInstance>> {
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		return listCache.allRange.map((id) => listCache.elements.get(id)!.clone())
	}

	async get<T extends Entity>(typeRef: TypeRef<T>, listId: string | null, id: string): Promise<T | null> {
		const parsedInstance = await this.getParsed(typeRef, listId, id)
		if (parsedInstance == null) {
			return null
		}
		return await this.modelMapper.mapToInstance<T>(parsedInstance)
	}

	async deleteIfExists<T extends PersistentEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void> {
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		elementId = serverToLocalIdEncoding(typeModel, elementId)

		const handler = this.customCacheHandlerMap.get(typeRef)
		const id: T["_id"] = [listId, elementId]
		await handler?.onBeforeCacheDeletion?.(id)

		switch (typeModel.type) {
			case TypeId.Element:
				this.entities.get(type)?.delete(elementId)
				break
			case TypeId.ListElement: {
				const cache = this.lists.get(type)?.get(assertNotNull(listId) as Id)
				if (cache != null) {
					cache.elements.delete(elementId)
					remove(cache.allRange, elementId)
				}
				break
			}
			case TypeId.BlobElement:
				this.blobEntities
					.get(type)
					?.get(assertNotNull(listId) as Id)
					?.elements.delete(elementId)
				break
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	async deleteMultiple<T extends PersistentEntity>(typeRef: TypeRef<T>, ids: T["_id"][]) {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		switch (typeModel.type) {
			case TypeId.Element: {
				for (const id of ids) {
					await this.deleteIfExists(typeRef, null, id[1])
				}
				break
			}
			case TypeId.ListElement: {
				for (const id of ids as IdTuple[]) {
					await this.deleteIfExists(typeRef, listIdPart(id), elementIdPart(id))
				}
				break
			}
			case TypeId.BlobElement: {
				for (const id of ids as IdTuple[]) {
					await this.deleteIfExists(typeRef, listIdPart(id) as T extends ListElementEntity | BlobElementEntity ? string : null, elementIdPart(id))
				}
				break
			}
			default: {
				throw new ProgrammingError("must be a persistent type")
			}
		}
	}

	async deleteRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string): Promise<void> {
		const typeId = getTypeString(typeRef)
		const cache = this.lists.get(typeId)
		if (cache) {
			cache.delete(listId)
		}
	}

	private putElementEntity(typeRef: TypeRef<unknown>, id: Id, entity: DecryptedParsedInstance) {
		getFromMap(this.entities, getTypeString(typeRef), () => new Map()).set(id, entity)
	}

	async isElementIdInCacheRange(typeRef: TypeRef<unknown>, listId: Id, elementId: Id): Promise<boolean> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		elementId = serverToLocalIdEncoding(typeModel, elementId)

		const cache = this.lists.get(getTypeString(typeRef))?.get(listId)
		return cache != null && !firstBiggerThanSecondBase64Ext(elementId, cache.upperRangeId) && !firstBiggerThanSecondBase64Ext(cache.lowerRangeId, elementId)
	}

	async put(typeRef: TypeRef<Entity>, instance: DecryptedParsedInstance): Promise<void> {
		const instanceClone = instance.clone()
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const instanceId = instanceClone.getAttributeByName("_id").asAnyEntityId()
		let { listId, elementId } = expandId(instanceId)
		if (instance.hasError()) {
			console.warn(
				`Trying to put parsed instance with _errors to ephemeral cache. Type: ${typeModel.app}/${typeModel.name}, Id: ["${listId}", "${elementId}"]`,
			)
			return
		}
		elementId = serverToLocalIdEncoding(typeModel, elementId)

		const handler = this.customCacheHandlerMap.get(typeRef as TypeRef<PersistentEntity>)
		if (handler?.onBeforeCacheUpdate) {
			const typedInstance = await this.modelMapper.mapToInstance(instance)
			await handler.onBeforeCacheUpdate(typedInstance as PersistentEntity)
		}

		switch (typeModel.type) {
			case TypeId.Element: {
				this.putElementEntity(typeRef, elementId, instanceClone)
				break
			}
			case TypeId.ListElement: {
				listId = listId as Id
				await this.putListElement(typeRef, listId, elementId, instanceClone)
				break
			}
			case TypeId.BlobElement: {
				listId = listId as Id
				await this.putBlobElement(typeRef, listId, elementId, instanceClone)
				break
			}
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	async putMultiple(typeRef: TypeRef<Entity>, instances: DecryptedParsedInstance[]): Promise<void> {
		for (const instance of instances) {
			await this.put(typeRef, instance)
		}
	}

	private async putBlobElement(typeRef: TypeRef<unknown>, listId: Id, elementId: Id, entity: DecryptedParsedInstance) {
		const cache = this.blobEntities.get(getTypeString(typeRef))?.get(listId)
		if (cache == null) {
			// first element in this list
			const newCache = {
				elements: new Map([[elementId, entity]]),
			}
			getFromMap(this.blobEntities, getTypeString(typeRef), () => new Map()).set(listId, newCache)
		} else {
			// if the element already exists in the cache, overwrite it
			cache.elements.set(elementId, entity)
		}
	}

	/** @pre: elementId is converted to base64ext if necessary */
	private async putListElement(typeRef: TypeRef<unknown>, listId: Id, elementId: Id, entity: DecryptedParsedInstance) {
		const typeId = getTypeString(typeRef)
		const cache = this.lists.get(typeId)?.get(listId)
		if (cache == null) {
			// first element in this list
			const newCache = {
				allRange: [elementId],
				lowerRangeId: elementId,
				upperRangeId: elementId,
				elements: new Map([[elementId, entity]]),
			}
			getFromMap(this.lists, typeId, () => new Map()).set(listId, newCache)
		} else {
			// if the element already exists in the cache, overwrite it
			// add new element to existing list if necessary
			cache.elements.set(elementId, entity)
			// always put the item into allRange(backing array only used by ephemeralCache), even if it has not updated
			// the range yet. It is a better option to have the item and range not updated yet than the opposite
			this.insertIntoAllRange(cache.allRange, elementId)
		}
	}

	/** precondition: elementId is converted to base64ext if necessary */
	private insertIntoAllRange(allRange: Array<Id>, elementId: Id) {
		for (let i = 0; i < allRange.length; i++) {
			const rangeElement = allRange[i]
			if (firstBiggerThanSecondBase64Ext(rangeElement, elementId)) {
				allRange.splice(i, 0, elementId)
				return
			}
			if (rangeElement === elementId) {
				return
			}
		}
		allRange.push(elementId)
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, startElementId: Id, count: number, reverse: boolean): Promise<T[]> {
		const parsedInstances = await this.provideFromRangeParsed(typeRef, listId, startElementId, count, reverse)
		return await this.modelMapper.mapToInstances(parsedInstances)
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Nullable<Id>, elementIds: Id[]): Promise<Array<T>> {
		const parsedInstances = await this.provideMultipleParsed(typeRef, listId, elementIds)
		return await this.modelMapper.mapToInstances(parsedInstances)
	}

	async getRangeForList<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
	): Promise<{
		lower: Id
		upper: Id
	} | null> {
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)

		if (listCache == null) {
			return null
		}

		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		return {
			lower: localToServerIdEncoding(typeModel, listCache.lowerRangeId),
			upper: localToServerIdEncoding(typeModel, listCache.upperRangeId),
		}
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, upperId: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		upperId = serverToLocalIdEncoding(typeModel, upperId)
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)
		if (listCache == null) {
			throw new Error("list does not exist")
		}
		listCache.upperRangeId = upperId
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lowerId: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		lowerId = serverToLocalIdEncoding(typeModel, lowerId)
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)
		if (listCache == null) {
			throw new Error("list does not exist")
		}
		listCache.lowerRangeId = lowerId
	}

	/**
	 * Creates a new list cache if there is none. Resets everything but elements.
	 * @param typeRef
	 * @param listId
	 * @param lower
	 * @param upper
	 */
	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		lower = serverToLocalIdEncoding(typeModel, lower)
		upper = serverToLocalIdEncoding(typeModel, upper)

		const typeId = getTypeString(typeRef)
		const listCache = this.lists.get(typeId)?.get(listId)
		if (listCache == null) {
			getFromMap(this.lists, typeId, () => new Map()).set(listId, {
				allRange: [],
				lowerRangeId: lower,
				upperRangeId: upper,
				elements: new Map(),
			})
		} else {
			listCache.lowerRangeId = lower
			listCache.upperRangeId = upper
			listCache.allRange = []
		}
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		return (
			this.lists
				.get(getTypeString(typeRef))
				?.get(listId)
				?.allRange.map((elementId) => {
					return localToServerIdEncoding(typeModel, elementId)
				}) ?? []
		)
	}

	async getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		return this.lastBatchIdPerGroup.get(groupId) ?? null
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		this.lastBatchIdPerGroup.set(groupId, batchId)
	}

	purgeStorage(): Promise<void> {
		return Promise.resolve()
	}

	async getLastUpdateTime(): Promise<LastUpdateTime> {
		return this.lastUpdateTime ? { type: "recorded", time: this.lastUpdateTime } : { type: "never" }
	}

	async putLastUpdateTime(value: number): Promise<void> {
		this.lastUpdateTime = value
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		const parsedInstances = await this.getWholeListParsed(typeRef, listId)
		return await this.modelMapper.mapToInstances(parsedInstances)
	}

	getCustomCacheHandlerMap(): CustomCacheHandlerMap {
		return this.customCacheHandlerMap
	}

	getUserId(): Id {
		return assertNotNull(this.userId, "No user id, not initialized?")
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		for (const [typeString, typeMap] of this.entities.entries()) {
			const typeRef = parseTypeString<PersistentEntity>(typeString)
			const handler = this.customCacheHandlerMap.get(typeRef)

			for (const [id, entity] of typeMap.entries()) {
				const ownerGroup = entity.getAttributeByName("_ownerGroup").asId()
				if (ownerGroup === owner) {
					await handler?.onBeforeCacheDeletion?.(idToElementId(id))
					typeMap.delete(id)
				}
			}
		}
		for (const [typeString, cacheForType] of this.lists.entries()) {
			const typeRef = parseTypeString(typeString)
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
			await this.deleteAllOwnedByFromCache(typeModel, cacheForType, owner)
		}
		for (const [typeString, cacheForType] of this.blobEntities.entries()) {
			const typeRef = parseTypeString(typeString)
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
			await this.deleteAllOwnedByFromCache(typeModel, cacheForType, owner)
		}
		this.lastBatchIdPerGroup.delete(owner)
	}

	private async deleteAllOwnedByFromCache(typeModel: TypeModel, cacheForType: Map<Id, ListCache | BlobElementCache>, owner: string): Promise<void> {
		// If we find at least one element in the list that is owned by our target owner, we delete the entire list.
		// This is OK in most cases because the vast majority of lists are single owner.
		// For the other cases, we are just clearing the cache a bit sooner than needed.
		const listIdsToDelete: string[] = []
		const handler = this.customCacheHandlerMap.get(new TypeRef<PersistentEntity>(typeModel.app, typeModel.id))
		for (const [listId, listCache] of cacheForType.entries()) {
			for (const [id, element] of listCache.elements.entries()) {
				const ownerGroup = element.getAttributeByName("_ownerGroup").asId()
				if (ownerGroup === owner) {
					await handler?.onBeforeCacheDeletion?.([listId, id])
					listIdsToDelete.push(listId)
					break
				}
			}
		}
		for (const listId of listIdsToDelete) {
			cacheForType.delete(listId)
		}
	}

	clearExcludedData(): Promise<void> {
		return Promise.resolve()
	}
}
