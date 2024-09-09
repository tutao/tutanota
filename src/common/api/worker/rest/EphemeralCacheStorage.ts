import { BlobElementEntity, ElementEntity, ListElementEntity, SomeEntity, TypeModel } from "../../common/EntityTypes.js"
import { EntityRestClient, typeRefToPath } from "./EntityRestClient.js"
import { firstBiggerThanSecond } from "../../common/utils/EntityUtils.js"
import { CacheStorage, expandId, LastUpdateTime } from "./DefaultEntityRestCache.js"
import { assertNotNull, clone, getFromMap, remove, TypeRef } from "@tutao/tutanota-utils"
import { CustomCacheHandlerMap } from "./CustomCacheHandler.js"
import { resolveTypeReference } from "../../common/EntityFunctions.js"
import { Type as TypeId } from "../../common/EntityConstants.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { customIdToBase64Url, ensureBase64Ext } from "../offline/OfflineStorage.js"

/** Cache for a single list. */
type ListCache = {
	/** All entities loaded inside the range. */
	allRange: Id[]
	lowerRangeId: Id
	upperRangeId: Id
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, ListElementEntity>
}

/** Map from list id to list cache. */
type ListTypeCache = Map<Id, ListCache>

type BlobElementCache = {
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, BlobElementEntity>
}

/** Map from list id to list cache. */
type BlobElementTypeCache = Map<Id, BlobElementCache>

export interface EphemeralStorageInitArgs {
	userId: Id
}

export class EphemeralCacheStorage implements CacheStorage {
	/** Path to id to entity map. */
	private readonly entities: Map<string, Map<Id, ElementEntity>> = new Map()
	private readonly lists: Map<string, ListTypeCache> = new Map()
	private readonly blobEntities: Map<string, BlobElementTypeCache> = new Map()
	private readonly customCacheHandlerMap: CustomCacheHandlerMap = new CustomCacheHandlerMap()
	private lastUpdateTime: number | null = null
	private userId: Id | null = null
	private lastBatchIdPerGroup = new Map<Id, Id>()

	init({ userId }: EphemeralStorageInitArgs) {
		this.userId = userId
	}

	deinit() {
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
	async get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<T | null> {
		// We downcast because we can't prove that map has correct entity on the type level
		const path = typeRefToPath(typeRef)
		const typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)
		switch (typeModel.type) {
			case TypeId.Element:
				return clone((this.entities.get(path)?.get(elementId) as T | undefined) ?? null)
			case TypeId.ListElement:
				return clone((this.lists.get(path)?.get(assertNotNull(listId))?.elements.get(elementId) as T | undefined) ?? null)
			case TypeId.BlobElement:
				return clone((this.blobEntities.get(path)?.get(assertNotNull(listId))?.elements.get(elementId) as T | undefined) ?? null)
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	async deleteIfExists<T>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void> {
		const path = typeRefToPath(typeRef)
		let typeModel: TypeModel
		typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)
		switch (typeModel.type) {
			case TypeId.Element:
				this.entities.get(path)?.delete(elementId)
				break
			case TypeId.ListElement:
				const cache = this.lists.get(path)?.get(assertNotNull(listId))
				if (cache != null) {
					cache.elements.delete(elementId)
					remove(cache.allRange, elementId)
				}
				break
			case TypeId.BlobElement:
				this.blobEntities.get(path)?.get(assertNotNull(listId))?.elements.delete(elementId)
				break
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	private addElementEntity<T extends ElementEntity>(typeRef: TypeRef<T>, id: Id, entity: T) {
		getFromMap(this.entities, typeRefToPath(typeRef), () => new Map()).set(id, entity)
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementId: Id): Promise<boolean> {
		const typeModel = await resolveTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)

		const cache = this.lists.get(typeRefToPath(typeRef))?.get(listId)
		return cache != null && !firstBiggerThanSecond(elementId, cache.upperRangeId) && !firstBiggerThanSecond(cache.lowerRangeId, elementId)
	}

	async put(originalEntity: SomeEntity): Promise<void> {
		const entity = clone(originalEntity)
		const typeRef = entity._type
		const typeModel = await resolveTypeReference(typeRef)
		let { listId, elementId } = expandId(originalEntity._id)
		elementId = ensureBase64Ext(typeModel, elementId)
		switch (typeModel.type) {
			case TypeId.Element:
				const elementEntity = entity as ElementEntity
				this.addElementEntity(elementEntity._type, elementId, elementEntity)
				break
			case TypeId.ListElement:
				const listElementEntity = entity as ListElementEntity
				const listElementTypeRef = typeRef as TypeRef<ListElementEntity>
				listId = listId as Id
				await this.putListElement(listElementTypeRef, listId, elementId, listElementEntity)
				break
			case TypeId.BlobElement:
				const blobElementEntity = entity as BlobElementEntity
				const blobTypeRef = typeRef as TypeRef<BlobElementEntity>
				listId = listId as Id
				await this.putBlobElement(blobTypeRef, listId, elementId, blobElementEntity)
				break
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	private async putBlobElement(typeRef: TypeRef<BlobElementEntity>, listId: Id, elementId: Id, entity: BlobElementEntity) {
		const cache = this.blobEntities.get(typeRefToPath(typeRef))?.get(listId)
		if (cache == null) {
			// first element in this list
			const newCache = {
				elements: new Map([[elementId, entity]]),
			}
			getFromMap(this.blobEntities, typeRefToPath(typeRef), () => new Map()).set(listId, newCache)
		} else {
			// if the element already exists in the cache, overwrite it
			cache.elements.set(elementId, entity)
		}
	}

	/** prcondition: elementId is converted to base64ext if necessary */
	private async putListElement(typeRef: TypeRef<ListElementEntity>, listId: Id, elementId: Id, entity: ListElementEntity) {
		const cache = this.lists.get(typeRefToPath(typeRef))?.get(listId)
		if (cache == null) {
			// first element in this list
			const newCache = {
				allRange: [elementId],
				lowerRangeId: elementId,
				upperRangeId: elementId,
				elements: new Map([[elementId, entity]]),
			}
			getFromMap(this.lists, typeRefToPath(typeRef), () => new Map()).set(listId, newCache)
		} else {
			// if the element already exists in the cache, overwrite it
			// add new element to existing list if necessary
			cache.elements.set(elementId, entity)
			const typeModel = await resolveTypeReference(typeRef)
			if (await this.isElementIdInCacheRange(typeRef, listId, customIdToBase64Url(typeModel, elementId))) {
				this.insertIntoRange(cache.allRange, elementId)
			}
		}
	}

	/** precondition: elementId is converted to base64ext if necessary */
	private insertIntoRange(allRange: Array<Id>, elementId: Id) {
		for (let i = 0; i < allRange.length; i++) {
			const rangeElement = allRange[i]
			if (firstBiggerThanSecond(rangeElement, elementId)) {
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
		const typeModel = await resolveTypeReference(typeRef)
		startElementId = ensureBase64Ext(typeModel, startElementId)

		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		let range = listCache.allRange
		let ids: Id[] = []
		if (reverse) {
			let i
			for (i = range.length - 1; i >= 0; i--) {
				if (firstBiggerThanSecond(startElementId, range[i])) {
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
			const i = range.findIndex((id) => firstBiggerThanSecond(id, startElementId))
			ids = range.slice(i, i + count)
		}
		let result: T[] = []
		for (let a = 0; a < ids.length; a++) {
			result.push(clone(listCache.elements.get(ids[a]) as T))
		}
		return result
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<T>> {
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)

		const typeModel = await resolveTypeReference(typeRef)
		elementIds = elementIds.map((el) => ensureBase64Ext(typeModel, el))

		if (listCache == null) {
			return []
		}
		let result: T[] = []
		for (let a = 0; a < elementIds.length; a++) {
			result.push(clone(listCache.elements.get(elementIds[a]) as T))
		}
		return result
	}

	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<{ lower: Id; upper: Id } | null> {
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)

		if (listCache == null) {
			return null
		}

		const typeModel = await resolveTypeReference(typeRef)
		return {
			lower: customIdToBase64Url(typeModel, listCache.lowerRangeId),
			upper: customIdToBase64Url(typeModel, listCache.upperRangeId),
		}
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, upperId: Id): Promise<void> {
		const typeModel = await resolveTypeReference(typeRef)
		upperId = ensureBase64Ext(typeModel, upperId)
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)
		if (listCache == null) {
			throw new Error("list does not exist")
		}
		listCache.upperRangeId = upperId
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lowerId: Id): Promise<void> {
		const typeModel = await resolveTypeReference(typeRef)
		lowerId = ensureBase64Ext(typeModel, lowerId)
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)
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
		const typeModel = await resolveTypeReference(typeRef)
		lower = ensureBase64Ext(typeModel, lower)
		upper = ensureBase64Ext(typeModel, upper)

		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)
		if (listCache == null) {
			getFromMap(this.lists, typeRefToPath(typeRef), () => new Map()).set(listId, {
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
		const typeModel = await resolveTypeReference(typeRef)
		return (
			this.lists
				.get(typeRefToPath(typeRef))
				?.get(listId)
				?.allRange.map((elementId) => {
					return customIdToBase64Url(typeModel, elementId)
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
		const listCache = this.lists.get(typeRefToPath(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		return listCache.allRange.map((id) => clone(listCache.elements.get(id) as T))
	}

	getCustomCacheHandlerMap(entityRestClient: EntityRestClient): CustomCacheHandlerMap {
		return this.customCacheHandlerMap
	}

	getUserId(): Id {
		return assertNotNull(this.userId, "No user id, not initialized?")
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		for (const typeMap of this.entities.values()) {
			for (const [id, entity] of typeMap.entries()) {
				if (entity._ownerGroup === owner) {
					typeMap.delete(id)
				}
			}
		}
		for (const cacheForType of this.lists.values()) {
			this.deleteAllOwnedByFromCache(cacheForType, owner)
		}
		for (const cacheForType of this.blobEntities.values()) {
			this.deleteAllOwnedByFromCache(cacheForType, owner)
		}
		this.lastBatchIdPerGroup.delete(owner)
	}

	async deleteWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<void> {
		this.lists.get(typeRef.type)?.delete(listId)
	}

	private deleteAllOwnedByFromCache(cacheForType: Map<Id, ListCache | BlobElementCache>, owner: string) {
		// If we find at least one element in the list that is owned by our target owner, we delete the entire list.
		// This is OK in most cases because the vast majority of lists are single owner.
		// For the other cases, we are just clearing the cache a bit sooner than needed.
		const listIdsToDelete: string[] = []
		for (const [listId, listCache] of cacheForType.entries()) {
			for (const [id, element] of listCache.elements.entries()) {
				if (element._ownerGroup === owner) {
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

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId)
	 * @param listId the mail list that we want to lock
	 */
	lockRangesDbAccess(listId: string): Promise<void> {
		return Promise.resolve()
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	unlockRangesDbAccess(listId: string): Promise<void> {
		return Promise.resolve()
	}
}
