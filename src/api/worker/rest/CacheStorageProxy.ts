import {CacheStorage, Range} from "./EntityRestCache"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {ListElementEntity, SomeEntity} from "../../common/EntityTypes"
import {TypeRef} from "@tutao/tutanota-utils"

export type StorageInitArgs = {persistent: true, databaseKey: Uint8Array, userId: Id} | {persistent: false}

export interface LateInitializedCacheStorage extends CacheStorage {
	initialize(args: StorageInitArgs): Promise<void>;
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
		private factory: (args: StorageInitArgs) => Promise<CacheStorage>
	) {}

	private get inner(): CacheStorage {
		if (this._inner == null) {
			throw new ProgrammingError("Cache storage is not initialized")
		}

		return this._inner
	}

	async initialize(args: StorageInitArgs): Promise<void> {
		if (this._inner != null) {
			// throw new ProgrammingError("Tried to initialize storage  twice!")
			// FIXME is this correct?
			return
		}
		this._inner = await this.factory(args)
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
}