import { ListElementEntity, SomeEntity, TypeRef } from "@tutao/meta"
import { OwnerEncSessionKeyProvider } from "@tutao/instance-pipeline"
import { ProgrammingError } from "@tutao/app-env"
import { EntityRestCache } from "../../../../../platform-kit/network/EntityRestCacheInterface"
import {
	EntityRestClientEraseOptions,
	EntityRestClientLoadOptions,
	EntityRestClientSetupOptions,
	EntityRestClientUpdateOptions,
} from "../../../../../platform-kit/network/EntityRestClient"
import { EntityUpdateData } from "../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export class AdminClientDummyEntityRestCache implements EntityRestCache {
	async entityEventsReceived(events: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<readonly EntityUpdateData[]> {
		return events
	}

	async erase<T extends SomeEntity>(instance: T, options: EntityRestClientEraseOptions | null): Promise<void> {
		throw new ProgrammingError("erase not implemented")
	}

	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Iterable<Id>): Promise<void> {
		throw new Error("deleteFromCacheIdExists not implemented.")
	}

	async eraseMultiple<T extends SomeEntity>(listId: Id, instances: Array<T>, options: EntityRestClientEraseOptions | null): Promise<void> {
		throw new ProgrammingError("eraseMultiple not implemented")
	}

	async load<T extends SomeEntity>(_typeRef: TypeRef<T>, _id: PropertyType<T, "_id">, _opts: EntityRestClientLoadOptions | null): Promise<T> {
		throw new ProgrammingError("load not implemented")
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider: OwnerEncSessionKeyProvider | null,
		opts: EntityRestClientLoadOptions | null,
	): Promise<Array<T>> {
		throw new ProgrammingError("loadMultiple not implemented")
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions | null,
	): Promise<T[]> {
		throw new ProgrammingError("loadRange not implemented")
	}

	async purgeStorage(): Promise<void> {
		return
	}

	async setup<T extends SomeEntity>(
		listId: Id | null,
		instance: T,
		extraHeaders: Dict | null,
		options: EntityRestClientSetupOptions | null,
	): Promise<Id | null> {
		throw new ProgrammingError("setup not implemented")
	}

	async setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		throw new ProgrammingError("setupMultiple not implemented")
	}

	async update<T extends SomeEntity>(instance: T, options: EntityRestClientUpdateOptions | null): Promise<void> {
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
