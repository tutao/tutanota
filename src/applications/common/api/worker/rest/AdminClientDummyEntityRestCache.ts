import { ListElementEntity, PersistentEntity, TypeRef } from "@tutao/meta"
import { ProgrammingError } from "@tutao/app-env"
import { EntityRestCache } from "../../../../../platform-kit/network/EntityRestCacheInterface"
import { EntityUpdateData } from "../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { Nullable } from "@tutao/utils"
import { EntityRestClientLoadOptions } from "../../../../../platform-kit/instance-pipeline/RestClientOptions"

export class AdminClientDummyEntityRestCache implements EntityRestCache {
	async entityEventsReceived(events: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<readonly EntityUpdateData[]> {
		return events
	}

	async erase<T extends PersistentEntity>(instance: T): Promise<void> {
		throw new ProgrammingError("erase not implemented")
	}

	async updateCacheWithMissedEntityUpdates(missedEntityUpdates: readonly EntityUpdateData[]): Promise<void> {
		return Promise.resolve()
	}

	deleteFromCacheIfExists<T extends PersistentEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Iterable<Id>): Promise<void> {
		throw new Error("deleteFromCacheIdExists not implemented.")
	}

	async eraseMultiple<T extends PersistentEntity>(listId: Id, instances: Array<T>): Promise<void> {
		throw new ProgrammingError("eraseMultiple not implemented")
	}

	async load<T extends PersistentEntity>(_typeRef: TypeRef<T>, _id: T["_id"], _opts: EntityRestClientLoadOptions): Promise<T> {
		throw new ProgrammingError("load not implemented")
	}

	async loadMultiple<T extends PersistentEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Array<Id>): Promise<Array<T>> {
		throw new ProgrammingError("loadMultiple not implemented")
	}

	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		throw new ProgrammingError("loadRange not implemented")
	}

	async purgeStorage(): Promise<void> {
		return
	}

	async setup<T extends PersistentEntity>(listId: Id | null, instance: T, extraHeaders: Nullable<Dict>): Promise<Id> {
		throw new ProgrammingError("setup not implemented")
	}

	async setupMultiple<T extends PersistentEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		throw new ProgrammingError("setupMultiple not implemented")
	}

	async update<T extends PersistentEntity>(instance: T): Promise<void> {
		throw new ProgrammingError("update not implemented")
	}

	async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		return null
	}

	async setLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
		return
	}

	async recordSyncTime(): Promise<void> {
		return
	}

	async timeSinceLastSyncMs(): Promise<number | null> {
		return null
	}

	async isOutOfSync(): Promise<boolean> {
		return false
	}
}
