import {CacheStorage, Range} from "./EntityRestCache"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {ListElementEntity, SomeEntity} from "../../common/EntityTypes"
import {TypeRef} from "@tutao/tutanota-utils"
import {OfflineStorage} from "../offline/OfflineStorage.js"
import {WorkerImpl} from "../WorkerImpl"
import {uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {EphemeralCacheStorage} from "./EphemeralCacheStorage"
import {EntityRestClient} from "./EntityRestClient.js"
import {CustomCacheHandlerMap} from "./CustomCacheHandler.js"

interface OfflineStorageInitArgs {
	userId: Id
	databaseKey: Uint8Array
	timeRangeDays: number | null
}

interface CacheStorageInitReturn {
	/** If the created storage is an OfflineStorage */
	isPersistent: boolean
	/** If a OfflineStorage was created, whether or not the backing database was created fresh or already existed */
	isNewOfflineDb: boolean
}

export interface LateInitializedCacheStorage extends CacheStorage {
	initialize(args: OfflineStorageInitArgs | null): Promise<CacheStorageInitReturn>;
}

/**
 * This is necessary so that we can release offline storage mode without having to rewrite the credentials handling system. Since it's possible that
 * a desktop user might not use a persistent session, and we won't know until they try to log in, we can only decide what kind of cache storage to use at login
 * This implementation allows us to avoid modifying too much of the worker public API. Once we make this obsolete, all we will have to do is
 * remove the initialize parameter from the LoginFacade, and tidy up the WorkerLocator init
 *
 * Create a proxy to a cache storage object.
 * It will be uninitialized, and unusable until {@method LateInitializedCacheStorage.initializeCacheStorage} has been called on the returned object
 * Once it is initialized, then it is safe to use
 * @param factory A factory function to get a CacheStorage implementation when initialize is called
 * @return {LateInitializedCacheStorage} The uninitialized proxy and a function to initialize it
 */
export class LateInitializedCacheStorageImpl implements LateInitializedCacheStorage {
	private _inner: CacheStorage | null = null

	constructor(
		private readonly worker: WorkerImpl,
		private readonly offlineStorageProvider: () => Promise<null | OfflineStorage>,
	) {
	}

	private get inner(): CacheStorage {
		if (this._inner == null) {
			throw new ProgrammingError("Cache storage is not initialized")
		}

		return this._inner
	}

	async initialize(args: OfflineStorageInitArgs | null): Promise<CacheStorageInitReturn> {
		// We might call this multiple times.
		// This happens when persistent credentials login fails and we need to start with new cache for new login.
		const {storage, isPersistent, isNewOfflineDb} = await this.getStorage(args)
		this._inner = storage
		return {
			isPersistent,
			isNewOfflineDb
		}
	}

	private async getStorage(args: OfflineStorageInitArgs | null): Promise<{storage: CacheStorage, isPersistent: boolean, isNewOfflineDb: boolean}> {
		if (args != null) {
			try {
				const storage = await this.offlineStorageProvider()
				if (storage != null) {
					const isNewOfflineDb = await storage.init(args.userId, uint8ArrayToKey(args.databaseKey), args.timeRangeDays)
					return {
						storage,
						isPersistent: true,
						isNewOfflineDb
					}
				}
			} catch (e) {
				// Precaution in case something bad happens to offline database. We want users to still be able to log in.
				console.error("Error while initializing offline cache storage", e)
				this.worker.sendError(e)
			}
		}
		return {
			storage: new EphemeralCacheStorage(),
			isPersistent: false,
			isNewOfflineDb: false
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

	getLastUpdateTime(): Promise<number | null> {
		return this.inner.getLastUpdateTime()
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
}