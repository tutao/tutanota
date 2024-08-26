import { QueuedBatch } from "../EventQueue.js"
import { EntityUpdate } from "../../entities/sys/TypeRefs.js"
import { ListElementEntity, SomeEntity } from "../../common/EntityTypes"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { TypeRef } from "@tutao/tutanota-utils"
import { EntityRestCache } from "./DefaultEntityRestCache.js"
import { EntityRestClientLoadOptions } from "./EntityRestClient.js"

export class AdminClientDummyEntityRestCache implements EntityRestCache {
	async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
		return batch.events
	}

	async erase<T extends SomeEntity>(instance: T): Promise<void> {
		throw new ProgrammingError("erase not implemented")
	}

	async load<T extends SomeEntity>(_typeRef: TypeRef<T>, _id: PropertyType<T, "_id">, _opts: EntityRestClientLoadOptions): Promise<T> {
		throw new ProgrammingError("load not implemented")
	}

	async loadMultiple<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementIds: Array<Id>): Promise<Array<T>> {
		throw new ProgrammingError("loadMultiple not implemented")
	}

	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		throw new ProgrammingError("loadRange not implemented")
	}

	async purgeStorage(): Promise<void> {
		return
	}

	async setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict): Promise<Id> {
		throw new ProgrammingError("setup not implemented")
	}

	async setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		throw new ProgrammingError("setupMultiple not implemented")
	}

	async update<T extends SomeEntity>(instance: T): Promise<void> {
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
