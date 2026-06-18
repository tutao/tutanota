import { OfflineStorage, Range } from "./OfflineStorage.js"
import { ProgrammingError } from "../../platform-kit/app-env"
import { Entity, ListElementEntity, ServerModelParsedInstance, SomeEntity, TypeRef } from "../../platform-kit/meta"
import { downcast, Nullable } from "../../platform-kit/utils"
import { EphemeralCacheStorage } from "./EphemeralCacheStorage"
import { CustomCacheHandlerMap } from "./CustomCacheHandler.js"
import { CacheStorage, LastUpdateTime } from "./CacheStorage.js"
import {
	CacheStorageInitReturn,
	CacheStorageLateInitializer,
	EphemeralStorageArgs,
	OfflineStorageArgs,
	StorageArgs,
} from "../../platform-kit/base/facades/CacheStorageLateInitializer"

/**
 * This is necessary so that we can release offline storage mode without having to rewrite the credentials handling system. Since it's possible that
 * a desktop user might not use a persistent session, and we won't know until they try to log in, we can only decide what kind of cache storage to use at login
 * This implementation allows us to avoid modifying too much of the worker public API. Once we make this obsolete, all we will have to do is
 * remove the initialize parameter from the LoginFacade, and tidy up the WorkerLocator init
 *
 * Create a proxy to a cache storage object.
 * It will be uninitialized, and unusable until {@method CacheStorageLateInitializer.initializeCacheStorage} has been called on the returned object
 * Once it is initialized, then it is safe to use
 * @param factory A factory function to get a CacheStorage implementation when initialize is called
 * @return {CacheStorageLateInitializer} The uninitialized proxy and a function to initialize it
 */
export type SomeStorage = OfflineStorage | EphemeralCacheStorage

export class LateInitializedCacheStorageImpl implements CacheStorageLateInitializer, CacheStorage {
	private _inner: SomeStorage | null = null
	constructor(
		private readonly sendError: (error: Error) => Promise<void>,
		private readonly ephemeralStorageProvider: () => Promise<EphemeralCacheStorage>,
		private readonly offlineStorageProvider: () => Promise<null | OfflineStorage>,
	) {}

	isInitialized(): boolean {
		return this._inner?.isInitialized() ?? false
	}

	async getParsed(typeRef: TypeRef<unknown>, listId: string | null, id: string): Promise<ServerModelParsedInstance | null> {
		return await this.inner.getParsed(typeRef, listId, id)
	}

	async provideFromRangeParsed(
		typeRef: TypeRef<unknown>,
		listId: string,
		start: string,
		count: number,
		reverse: boolean,
	): Promise<ServerModelParsedInstance[]> {
		return await this.inner.provideFromRangeParsed(typeRef, listId, start, count, reverse)
	}

	async provideMultipleParsed(typeRef: TypeRef<unknown>, listId: Nullable<string>, elementIds: string[]): Promise<ServerModelParsedInstance[]> {
		return await this.inner.provideMultipleParsed(typeRef, listId, elementIds)
	}

	async getWholeListParsed(typeRef: TypeRef<unknown>, listId: string): Promise<ServerModelParsedInstance[]> {
		return await this.inner.getWholeListParsed(typeRef, listId)
	}

	private get inner(): CacheStorage {
		if (this._inner == null) {
			throw new ProgrammingError("Cache storage is not initialized")
		}

		return this._inner
	}

	async initialize(args: StorageArgs): Promise<CacheStorageInitReturn> {
		// We might call this multiple times.
		// This happens when persistent credentials login fails, and we need to start with new cache for new login.
		const { storage, isPersistent, isNewOfflineDb } = await this.getStorage(args)
		this._inner = storage
		return {
			isPersistent,
			isNewOfflineDb,
		}
	}

	async deInitialize(): Promise<void> {
		await this._inner?.deinit()
		this._inner = null
	}

	private async getStorage(args: StorageArgs): Promise<{ storage: SomeStorage; isPersistent: boolean; isNewOfflineDb: boolean }> {
		if (args instanceof OfflineStorageArgs) {
			try {
				const storage = await this.offlineStorageProvider()
				if (storage != null) {
					const isNewOfflineDb = await storage.init(args)
					return {
						storage,
						isPersistent: true,
						isNewOfflineDb,
					}
				}
			} catch (e) {
				// Precaution in case something bad happens to offline database. We want users to still be able to log in.
				console.error("Error while initializing offline cache storage", e)
				this.sendError(e)
				args = new EphemeralStorageArgs(args.userId)
			}
		}
		// both "else" case and fallback for unavailable storage and error cases
		const storage = await this.ephemeralStorageProvider()
		storage.init(downcast<EphemeralStorageArgs>(args))
		return {
			storage,
			isPersistent: false,
			isNewOfflineDb: false,
		}
	}

	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void> {
		return this.inner.deleteIfExists(typeRef, listId, id)
	}

	deleteRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string): Promise<void> {
		return this.inner.deleteRange(typeRef, listId)
	}

	get<T extends Entity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		return this.inner.get<T>(typeRef, listId, id)
	}

	getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		return this.inner.getIdsInRange(typeRef, listId)
	}

	async getLastUpdateTime(): Promise<LastUpdateTime> {
		return this._inner ? this.inner.getLastUpdateTime() : { type: "uninitialized" }
	}

	getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Range | null> {
		return this.inner.getRangeForList(typeRef, listId)
	}

	isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean> {
		return this.inner.isElementIdInCacheRange(typeRef, listId, id)
	}

	provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		return this.inner.provideFromRange(typeRef, listId, start, count, reverse)
	}

	provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string, elementIds: string[]): Promise<T[]> {
		return this.inner.provideMultiple(typeRef, listId, elementIds)
	}

	getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>> {
		return this.inner.getWholeList(typeRef, listId)
	}

	purgeStorage(): Promise<void> {
		return this.inner.purgeStorage()
	}

	put(typeRef: TypeRef<unknown>, instance: ServerModelParsedInstance): Promise<void> {
		return this.inner.put(typeRef, instance)
	}

	putMultiple(typeRef: TypeRef<unknown>, instances: ServerModelParsedInstance[]): Promise<void> {
		return this.inner.putMultiple(typeRef, instances)
	}

	putLastUpdateTime(value: number): Promise<void> {
		return this.inner.putLastUpdateTime(value)
	}

	setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.inner.setLowerRangeForList(typeRef, listId, id)
	}

	setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void> {
		return this.inner.setNewRangeForList(typeRef, listId, lower, upper)
	}

	setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void> {
		return this.inner.setUpperRangeForList(typeRef, listId, id)
	}

	getCustomCacheHandlerMap(): CustomCacheHandlerMap {
		return this.inner.getCustomCacheHandlerMap()
	}

	getUserId(): Id {
		return this.inner.getUserId()
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		return this.inner.deleteAllOwnedBy(owner)
	}

	clearExcludedData(timeRangeDate: Date): Promise<void> {
		return this.inner.clearExcludedData(timeRangeDate)
	}
}
