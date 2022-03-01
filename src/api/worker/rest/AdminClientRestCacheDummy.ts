import {QueuedBatch} from "../search/EventQueue"
import {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {ListElementEntity, SomeEntity} from "../../common/EntityTypes"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {TypeRef} from "@tutao/tutanota-utils"
import {IEntityRestCache} from "./EntityRestCache"

export class AdminClientRestCacheDummy implements IEntityRestCache {
	async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
		return batch.events
	}

	async erase<T extends SomeEntity>(instance: T): Promise<void> {
		throw new ProgrammingError("erase not implemented")
	}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, queryParameters?: Dict, extraHeaders?: Dict): Promise<T> {
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

	async recordSyncTime(): Promise<void> {
		return
	}

	async timeSinceLastSync(): Promise<number | null> {
		return null
	}
}