import { BlobElementEntity, Entity, ListElementEntity, ServerModelParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes.js"
import { customIdToBase64Url, ensureBase64Ext, firstBiggerThanSecond, GENERATED_MIN_ID } from "../../common/utils/EntityUtils.js"
import { CacheStorage, LastUpdateTime } from "./DefaultEntityRestCache.js"
import { assertNotNull, clone, filterNull, getFromMap, getTypeString, newPromise, Nullable, parseTypeString, remove, TypeRef } from "@tutao/tutanota-utils"
import { CustomCacheHandlerMap } from "./cacheHandler/CustomCacheHandler.js"
import { Type as TypeId } from "../../common/EntityConstants.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { AttributeModel } from "../../common/AttributeModel"
import { ModelMapper } from "../crypto/ModelMapper"
import { ServerTypeModelResolver } from "../../common/EntityFunctions"
import { expandId } from "./RestClientIdUtils"
import { hasError } from "../../common/utils/ErrorUtils"
import { SpamClassificationModel } from "../../../../mail-app/workerUtils/spamClassification/SpamClassifier"

/** Cache for a single list. */
type ListCache = {
	/** All entities loaded inside the range. */
	allRange: Id[]
	lowerRangeId: Id
	upperRangeId: Id
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, ServerModelParsedInstance>
}

/** Map from list id to list cache. */
type ListTypeCache = Map<Id, ListCache>

type BlobElementCache = {
	/** All the entities loaded, inside or outside the range (e.g. load for a single entity). */
	elements: Map<Id, ServerModelParsedInstance>
}

/** Map from list id to list cache. */
type BlobElementTypeCache = Map<Id, BlobElementCache>

export interface EphemeralStorageInitArgs {
	userId: Id
}

export class EphemeralCacheStorage implements CacheStorage {
	/** Path to id to entity map. */
	private readonly entities: Map<string, Map<Id, ServerModelParsedInstance>> = new Map()
	private readonly lists: Map<string, ListTypeCache> = new Map()
	private readonly blobEntities: Map<string, BlobElementTypeCache> = new Map()
	private readonly spamClassificationModelCache: Map<Id, SpamClassificationModel> = new Map()
	private lastUpdateTime: number | null = null
	private lastTrainingDataId: Id = GENERATED_MIN_ID
	private lastTrainedFromScratchTime: number | null = null
	private userId: Id | null = null
	private lastBatchIdPerGroup = new Map<Id, Id>()

	constructor(
		private readonly modelMapper: ModelMapper,
		private readonly typeModelResolver: ServerTypeModelResolver,
		private readonly customCacheHandlerMap: CustomCacheHandlerMap,
	) {}

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
	async getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<ServerModelParsedInstance | null> {
		// We downcast because we can't prove that map has correct entity on the type level
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		id = ensureBase64Ext(typeModel, id)
		switch (typeModel.type) {
			case TypeId.Element:
				return clone(this.entities.get(type)?.get(id) ?? null)
			case TypeId.ListElement:
				return clone(this.lists.get(type)?.get(assertNotNull(listId))?.elements.get(id) ?? null)
			case TypeId.BlobElement:
				return clone(this.blobEntities.get(type)?.get(assertNotNull(listId))?.elements.get(id) ?? null)
			default:
				throw new ProgrammingError("must be a persistent type")
		}
	}

	async provideFromRangeParsed(
		typeRef: TypeRef<unknown>,
		listId: string,
		startElementId: string,
		count: number,
		reverse: boolean,
	): Promise<ServerModelParsedInstance[]> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		startElementId = ensureBase64Ext(typeModel, startElementId)

		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		let range = listCache.allRange
		let ids: Id[]
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
		let result: ServerModelParsedInstance[] = []
		for (let a = 0; a < ids.length; a++) {
			const cachedInstance = listCache.elements.get(ids[a])
			if (cachedInstance != null) {
				const clonedInstance = clone(cachedInstance)
				result.push(clonedInstance)
			}
		}
		return result
	}

	async provideMultipleParsed(typeRef: TypeRef<unknown>, listId: Nullable<string>, elementIds: string[]): Promise<ServerModelParsedInstance[]> {
		const result = await Promise.all(
			elementIds.map((elementId) => {
				return this.getParsed(typeRef, listId, elementId)
			}),
		)
		return filterNull(result)
	}

	async getWholeListParsed(typeRef: TypeRef<unknown>, listId: string): Promise<ServerModelParsedInstance[]> {
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)

		if (listCache == null) {
			return []
		}

		return listCache.allRange.map((id) => clone(listCache.elements.get(id)!))
	}

	async get<T extends Entity>(typeRef: TypeRef<T>, listId: string | null, id: string): Promise<T | null> {
		const parsedInstance = await this.getParsed(typeRef, listId, id)
		if (parsedInstance == null) {
			return null
		}
		return await this.modelMapper.mapToInstance<T>(typeRef, parsedInstance)
	}

	async deleteIfExists<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: T extends ListElementEntity | BlobElementEntity ? Id : null,
		elementId: Id,
	): Promise<void> {
		const type = getTypeString(typeRef)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)

		const handler = this.customCacheHandlerMap.get(typeRef)
		const id: T["_id"] = listId == null ? elementId : [listId, elementId]
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

	private putElementEntity(typeRef: TypeRef<unknown>, id: Id, entity: ServerModelParsedInstance) {
		getFromMap(this.entities, getTypeString(typeRef), () => new Map()).set(id, entity)
	}

	async isElementIdInCacheRange(typeRef: TypeRef<unknown>, listId: Id, elementId: Id): Promise<boolean> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		elementId = ensureBase64Ext(typeModel, elementId)

		const cache = this.lists.get(getTypeString(typeRef))?.get(listId)
		return cache != null && !firstBiggerThanSecond(elementId, cache.upperRangeId) && !firstBiggerThanSecond(cache.lowerRangeId, elementId)
	}

	async put(typeRef: TypeRef<unknown>, instance: ServerModelParsedInstance): Promise<void> {
		const instanceClone = clone(instance)
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const instanceId = AttributeModel.getAttribute<IdTuple | Id>(instanceClone, "_id", typeModel)
		let { listId, elementId } = expandId(instanceId)
		if (hasError(instance)) {
			console.warn(
				`Trying to put parsed instance with _errors to ephemeral cache. Type: ${typeModel.app}/${typeModel.name}, Id: ["${listId}", "${elementId}"]`,
			)
			return
		}
		elementId = ensureBase64Ext(typeModel, elementId)

		const handler = this.customCacheHandlerMap.get(typeRef as TypeRef<SomeEntity>)
		if (handler?.onBeforeCacheUpdate) {
			const typedInstance = await this.modelMapper.mapToInstance(typeRef, instance)
			await handler.onBeforeCacheUpdate(typedInstance as SomeEntity)
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

	async putMultiple(typeRef: TypeRef<unknown>, instances: ServerModelParsedInstance[]): Promise<void> {
		for (const instance of instances) {
			await this.put(typeRef, instance)
		}
	}

	private async putBlobElement(typeRef: TypeRef<unknown>, listId: Id, elementId: Id, entity: ServerModelParsedInstance) {
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
	private async putListElement(typeRef: TypeRef<unknown>, listId: Id, elementId: Id, entity: ServerModelParsedInstance) {
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
		const parsedInstances = await this.provideFromRangeParsed(typeRef, listId, startElementId, count, reverse)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Nullable<Id>, elementIds: Id[]): Promise<Array<T>> {
		const parsedInstances = await this.provideMultipleParsed(typeRef, listId, elementIds)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
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
			lower: customIdToBase64Url(typeModel, listCache.lowerRangeId),
			upper: customIdToBase64Url(typeModel, listCache.upperRangeId),
		}
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, upperId: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		upperId = ensureBase64Ext(typeModel, upperId)
		const listCache = this.lists.get(getTypeString(typeRef))?.get(listId)
		if (listCache == null) {
			throw new Error("list does not exist")
		}
		listCache.upperRangeId = upperId
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lowerId: Id): Promise<void> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		lowerId = ensureBase64Ext(typeModel, lowerId)
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
		lower = ensureBase64Ext(typeModel, lower)
		upper = ensureBase64Ext(typeModel, upper)

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

	async getLastTrainingDataIndexId(): Promise<Id> {
		return this.lastTrainingDataId
	}

	async setLastTrainingDataIndexId(id: Id): Promise<void> {
		this.lastTrainingDataId = id
	}

	async getLastTrainedFromScratchTime(): Promise<number> {
		return this.lastTrainedFromScratchTime ?? Date.now()
	}

	async setLastTrainedFromScratchTime(ms: number): Promise<void> {
		this.lastTrainedFromScratchTime = ms
	}

	async setSpamClassificationModel(model: SpamClassificationModel): Promise<void> {
		this.spamClassificationModelCache.set(model.ownerGroup, model)
	}

	async getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>> {
		return this.spamClassificationModelCache.get(ownerGroup) ?? null
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		const parsedInstances = await this.getWholeListParsed(typeRef, listId)
		return await this.modelMapper.mapToInstances(typeRef, parsedInstances)
	}

	getCustomCacheHandlerMap(): CustomCacheHandlerMap {
		return this.customCacheHandlerMap
	}

	getUserId(): Id {
		return assertNotNull(this.userId, "No user id, not initialized?")
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		for (const [typeString, typeMap] of this.entities.entries()) {
			const typeRef = parseTypeString(typeString) as TypeRef<SomeEntity>
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
			const handler = this.customCacheHandlerMap.get(typeRef)

			for (const [id, entity] of typeMap.entries()) {
				const ownerGroup = AttributeModel.getAttribute<Id>(entity, "_ownerGroup", typeModel)
				if (ownerGroup === owner) {
					await handler?.onBeforeCacheDeletion?.(id)
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
		const handler = this.customCacheHandlerMap.get(new TypeRef<SomeEntity>(typeModel.app, typeModel.id))
		for (const [listId, listCache] of cacheForType.entries()) {
			for (const [id, element] of listCache.elements.entries()) {
				const ownerGroup = AttributeModel.getAttribute<Id>(element, "_ownerGroup", typeModel)
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
