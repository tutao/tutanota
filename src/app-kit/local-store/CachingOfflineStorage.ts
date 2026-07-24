import { CacheStorage, LastUpdateTime } from "./CacheStorage"
import { OfflineStorage, Range } from "./OfflineStorage"
import { EphemeralCacheStorage } from "./EphemeralCacheStorage"
import { BlobElementEntity, Entity, getTypeString, ListElementEntity, ServerModelParsedInstance, SomeEntity, TypeRef } from "@tutao/meta"
import { CustomCacheHandlerMap } from "./CustomCacheHandler"
import { OfflineStorageArgs } from "../../platform-kit/base/facades/CacheStorageLateInitializer"
import { CacheSyncStatus } from "../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { isNotEmpty } from "@tutao/utils"
import { ModelMapper } from "@tutao/instance-pipeline"

export class CachingOfflineStorage implements CacheStorage {
	private cacheSyncStatus: CacheSyncStatus = CacheSyncStatus.Offline

	constructor(
		private readonly delegate: OfflineStorage,
		private readonly fastCache: EphemeralCacheStorage,
		private readonly modelMapper: ModelMapper,
	) {}

	private shouldOnlyUseFastCache(): boolean {
		return this.cacheSyncStatus === CacheSyncStatus.OnlineSyncOngoing
	}

	private shouldWriteToFastCacheWhenReadingDelegate(): boolean {
		return this.cacheSyncStatus !== CacheSyncStatus.Offline
	}

	async setCacheSyncStatus(cacheSyncStatus: CacheSyncStatus): Promise<void> {
		console.log("cacheSyncStatus " + cacheSyncStatus)
		this.cacheSyncStatus = cacheSyncStatus
		if (cacheSyncStatus === CacheSyncStatus.OnlineSyncDone) {
			await this.fastCache.deleteAllRanges()
		} else if (cacheSyncStatus === CacheSyncStatus.Offline) {
			await this.fastCache.purgeStorage()
		}
	}

	async init(args: OfflineStorageArgs): Promise<boolean> {
		const isNewOfflineDb = await this.delegate.init(args)
		this.fastCache.init(args)
		return isNewOfflineDb
	}

	async deinit(): Promise<void> {
		await this.setCacheSyncStatus(CacheSyncStatus.Offline)
		return await this.delegate.deinit()
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		await this.delegate.deleteAllOwnedBy(owner)
		return await this.fastCache.deleteAllOwnedBy(owner)
	}

	async deleteIfExists<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: T extends ListElementEntity | BlobElementEntity ? Id : null,
		id: Id,
	): Promise<void> {
		await this.delegate.deleteIfExists(typeRef, listId, id)
		return await this.fastCache.deleteIfExists(typeRef, listId, id)
	}

	async deleteMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, ids: T["_id"][]): Promise<void> {
		await this.delegate.deleteMultiple(typeRef, ids)
		return await this.fastCache.deleteMultiple(typeRef, ids)
	}

	async deleteRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string): Promise<void> {
		await this.delegate.deleteRange(typeRef, listId)
		return await this.fastCache.deleteRange(typeRef, listId)
	}

	async get<T extends Entity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		const fastResult = await this.fastCache.get(typeRef, listId, id)
		const shouldLoadOnlyFromFastCache = this.shouldOnlyUseFastCache()
		if (shouldLoadOnlyFromFastCache) {
			console.log(`${this.cacheSyncStatus}: returning from fastCache ${getTypeString(typeRef)} ${listId} ${id}`)
			return fastResult
		}

		if (fastResult) {
			console.log(`${this.cacheSyncStatus}: returning from fastCache ${getTypeString(typeRef)} ${listId} ${id}`)
			return fastResult
		} else {
			const parsedInstance = await this.delegate.getParsed(typeRef, listId, id)
			if (parsedInstance && this.shouldWriteToFastCacheWhenReadingDelegate()) {
				await this.fastCache.put(typeRef, parsedInstance)
				return await this.fastCache.get(typeRef, listId, id)
			}
			return parsedInstance ? this.modelMapper.mapToInstance<T>(typeRef, parsedInstance) : null
		}
	}

	getCustomCacheHandlerMap(): CustomCacheHandlerMap {
		return this.delegate.getCustomCacheHandlerMap()
	}

	async getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		const fastResult = await this.fastCache.getIdsInRange(typeRef, listId)
		const shouldLoadOnlyFromFastCache = this.shouldOnlyUseFastCache()
		if (shouldLoadOnlyFromFastCache) {
			return fastResult
		}
		if (isNotEmpty(fastResult)) {
			return fastResult
		}
		return this.delegate.getIdsInRange(typeRef, listId)
	}

	getLastUpdateTime(): Promise<LastUpdateTime> {
		return this.delegate.getLastUpdateTime()
	}

	async getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<ServerModelParsedInstance | null> {
		const fastResult = await this.fastCache.getParsed(typeRef, listId, id)
		const shouldLoadOnlyFromFastCache = this.shouldOnlyUseFastCache()
		if (shouldLoadOnlyFromFastCache) {
			console.log(`${this.cacheSyncStatus}: returning from fastCache ${getTypeString(typeRef)} ${listId} ${id}`)
			return fastResult
		}
		if (fastResult) {
			console.log(`${this.cacheSyncStatus}: returning from fastCache ${getTypeString(typeRef)} ${listId} ${id}`)
			return fastResult
		} else {
			const parsedInstance = await this.delegate.getParsed(typeRef, listId, id)
			if (parsedInstance && this.shouldWriteToFastCacheWhenReadingDelegate()) {
				await this.fastCache.put(typeRef, parsedInstance)
			}
			return parsedInstance
		}
	}

	async getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Range | null> {
		const fastResult = await this.fastCache.getRangeForList(typeRef, listId)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.getRangeForList(typeRef, listId)
	}

	getUserId(): Id {
		return this.delegate.getUserId()
	}

	async getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		const fastResult = await this.fastCache.getWholeList(typeRef, listId)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.getWholeList(typeRef, listId)
	}

	async getWholeListParsed(typeRef: TypeRef<ListElementEntity>, listId: Id): Promise<Array<ServerModelParsedInstance>> {
		const fastResult = await this.fastCache.getWholeListParsed(typeRef, listId)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.getWholeListParsed(typeRef, listId)
	}

	async isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean> {
		const fastResult = await this.fastCache.isElementIdInCacheRange(typeRef, listId, id)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.isElementIdInCacheRange(typeRef, listId, id)
	}

	isInitialized(): boolean {
		return this.delegate.isInitialized()
	}

	async provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const fastResult = await this.fastCache.provideFromRange(typeRef, listId, start, count, reverse)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.provideFromRange(typeRef, listId, start, count, reverse)
	}

	async provideFromRangeParsed(
		typeRef: TypeRef<ListElementEntity>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
	): Promise<ServerModelParsedInstance[]> {
		const fastResult = await this.fastCache.provideFromRangeParsed(typeRef, listId, start, count, reverse)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		return await this.delegate.provideFromRangeParsed(typeRef, listId, start, count, reverse)
	}

	async provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<T>> {
		const fastResult = await this.fastCache.provideMultiple(typeRef, listId, elementIds)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		if (fastResult.length === elementIds.length) {
			return fastResult
		} else {
			const parsedInstances = await this.delegate.provideMultipleParsed(typeRef, listId, elementIds)
			if (this.shouldWriteToFastCacheWhenReadingDelegate()) {
				await this.fastCache.putMultiple(typeRef, parsedInstances)
				return await this.fastCache.provideMultiple(typeRef, listId, elementIds)
			}
			return this.modelMapper.mapToInstances(typeRef, parsedInstances)
		}
	}

	async provideMultipleParsed<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<ServerModelParsedInstance>> {
		const fastResult = await this.fastCache.provideMultipleParsed(typeRef, listId, elementIds)
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return fastResult
		}
		if (fastResult.length === elementIds.length) {
			return fastResult
		} else {
			const parsedInstances = await this.delegate.provideMultipleParsed(typeRef, listId, elementIds)
			if (this.shouldWriteToFastCacheWhenReadingDelegate()) {
				await this.fastCache.putMultiple(typeRef, parsedInstances)
			}
			return parsedInstances
		}
	}

	async purgeStorage(): Promise<void> {
		await this.delegate.purgeStorage()
		return await this.fastCache.purgeStorage()
	}

	async put(typeRef: TypeRef<SomeEntity>, instance: ServerModelParsedInstance): Promise<void> {
		await this.delegate.put(typeRef, instance)
		await this.fastCache.put(typeRef, instance)
	}

	putLastUpdateTime(value: number): Promise<void> {
		return this.delegate.putLastUpdateTime(value)
	}

	async putMultiple(typeRef: TypeRef<SomeEntity>, instances: ServerModelParsedInstance[]): Promise<void> {
		await this.delegate.putMultiple(typeRef, instances)
		await this.fastCache.putMultiple(typeRef, instances)
	}

	async setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return await this.fastCache.setLowerRangeForList(typeRef, listId, id)
		}
		return await this.delegate.setLowerRangeForList(typeRef, listId, id)
	}

	async setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return await this.fastCache.setNewRangeForList(typeRef, listId, lower, upper)
		}
		return await this.delegate.setNewRangeForList(typeRef, listId, lower, upper)
	}

	async setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		const shouldOnlyUseFastCache = this.shouldOnlyUseFastCache()
		if (shouldOnlyUseFastCache) {
			return await this.fastCache.setUpperRangeForList(typeRef, listId, id)
		}
		return await this.delegate.setUpperRangeForList(typeRef, listId, id)
	}
}
