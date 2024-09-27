import { CacheStorage, LastUpdateTime, Range } from "./DefaultEntityRestCache.js"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { ListElementEntity, SomeEntity } from "../../common/EntityTypes"
import { TypeRef } from "@tutao/tutanota-utils"
import { OfflineStorage, OfflineStorageInitArgs } from "../offline/OfflineStorage.js"
import { EphemeralCacheStorage, EphemeralStorageInitArgs } from "./EphemeralCacheStorage"
import { EntityRestClient } from "./EntityRestClient.js"
import { CustomCacheHandlerMap } from "./CustomCacheHandler.js"

export interface EphemeralStorageArgs extends EphemeralStorageInitArgs {
	type: "ephemeral"
}

export type OfflineStorageArgs = OfflineStorageInitArgs & {
	type: "offline"
}

interface CacheStorageInitReturn {
	/** If the created storage is an OfflineStorage */
	isPersistent: boolean
	/** If a OfflineStorage was created, whether or not the backing database was created fresh or already existed */
	isNewOfflineDb: boolean
}

export interface CacheStorageLateInitializer {
	initialize(args: OfflineStorageArgs | EphemeralStorageArgs): Promise<CacheStorageInitReturn>

	deInitialize(): Promise<void>
}

type SomeStorage = OfflineStorage | EphemeralCacheStorage

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
export class LateInitializedCacheStorageImpl implements CacheStorageLateInitializer, CacheStorage {
	private _inner: SomeStorage | null = null

	constructor(private readonly sendError: (error: Error) => Promise<void>, private readonly offlineStorageProvider: () => Promise<null | OfflineStorage>) {}

	private get inner(): CacheStorage {
		if (this._inner == null) {
			throw new ProgrammingError("Cache storage is not initialized")
		}

		return this._inner
	}

	async initialize(args: OfflineStorageArgs | EphemeralStorageArgs): Promise<CacheStorageInitReturn> {
		// We might call this multiple times.
		// This happens when persistent credentials login fails and we need to start with new cache for new login.
		const { storage, isPersistent, isNewOfflineDb } = await this.getStorage(args)
		this._inner = storage
		return {
			isPersistent,
			isNewOfflineDb,
		}
	}

	async deInitialize(): Promise<void> {
		this._inner?.deinit()
	}

	private async getStorage(
		args: OfflineStorageArgs | EphemeralStorageArgs,
	): Promise<{ storage: SomeStorage; isPersistent: boolean; isNewOfflineDb: boolean }> {
		if (args.type === "offline") {
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
			}
		}
		// both "else" case and fallback for unavailable storage and error cases
		const storage = new EphemeralCacheStorage()
		await storage.init(args)
		return {
			storage,
			isPersistent: false,
			isNewOfflineDb: false,
		}
	}

	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void> {
		return this.inner.deleteIfExists(typeRef, listId, id)
	}

	get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null> {
		return this.inner.get(typeRef, listId, id)
	}

	getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>> {
		return this.inner.getIdsInRange(typeRef, listId)
	}

	getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		return this.inner.getLastBatchIdForGroup(groupId)
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

	put(originalEntity: SomeEntity): Promise<void> {
		return this.inner.put(originalEntity)
	}

	putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		return this.inner.putLastBatchIdForGroup(groupId, batchId)
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

	getCustomCacheHandlerMap(entityRestClient: EntityRestClient): CustomCacheHandlerMap {
		return this.inner.getCustomCacheHandlerMap(entityRestClient)
	}

	getUserId(): Id {
		return this.inner.getUserId()
	}

	async deleteAllOwnedBy(owner: Id): Promise<void> {
		return this.inner.deleteAllOwnedBy(owner)
	}

	async deleteWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<void> {
		return this.inner.deleteWholeList(typeRef, listId)
	}

	clearExcludedData(): Promise<void> {
		return this.inner.clearExcludedData()
	}

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId)
	 * @param listId the mail list that we want to lock
	 */
	lockRangesDbAccess(listId: Id): Promise<void> {
		return this.inner.lockRangesDbAccess(listId)
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	unlockRangesDbAccess(listId: Id): Promise<void> {
		return this.inner.unlockRangesDbAccess(listId)
	}
}
