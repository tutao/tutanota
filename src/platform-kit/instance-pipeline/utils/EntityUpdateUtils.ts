import { AppName, getTypeString, isSameId, isSameTypeRef, OperationType, PersistentEntity, TypeRef } from "@tutao/meta"
import { Nullable } from "@tutao/utils"
import { EntityUpdate, Patch } from "@tutao/entities/sys"

import { DecryptedParsedInstance } from "@tutao/instance-pipeline"

/**
 * A type similar to {@link EntityUpdate} but mapped to make it easier to work with.
 */
export type EntityUpdateData<T extends PersistentEntity = PersistentEntity> = {
	typeRef: TypeRef<T>
	instanceListId: Id | null
	instanceId: string
	operation: OperationType
	instance: Nullable<DecryptedParsedInstance>
	blobInstance: Nullable<DecryptedParsedInstance>

	// emptyList: when server did not send patchList, or empty re-write to the server database.
	// length > 0: normal case for patch
	patches: Nullable<Array<Patch>>
	// status indicating if the update modified the cache. Missed updates are update the cache using
	// deleteMultiple and putMultiple in DefaultEntityRestCache.updateCacheWithMissedEntityUpdates to minimize IPC overhead.
	cachingStatus: CachingStatus
}

export enum CachingStatus {
	CacheNotUpdated = "CacheNotUpdated",
	CacheUpdated = "CacheUpdated",
}

export async function entityUpdateToUpdateData<T extends PersistentEntity>(
	update: EntityUpdate,
	instance: Nullable<DecryptedParsedInstance> = null,
	blobInstance: Nullable<DecryptedParsedInstance> = null,
): Promise<EntityUpdateData<T>> {
	const typeId = parseInt(update.typeId)
	const typeRefOfEntityUpdateType = new TypeRef<T>(update.application as AppName, typeId)
	return {
		typeRef: typeRefOfEntityUpdateType,
		instanceListId: (update.instanceListId === "" ? null : update.instanceListId) as EntityUpdateData<T>["instanceListId"],
		instanceId: update.instanceId,
		operation: update.operation as OperationType,
		patches: update.patch?.patches ?? null,
		instance,
		blobInstance,
		cachingStatus: CachingStatus.CacheNotUpdated,
	}
}

export function isUpdateForTypeRef<T extends PersistentEntity>(typeRef: TypeRef<T>, update: EntityUpdateData): update is EntityUpdateData<T> {
	return isSameTypeRef(typeRef, update.typeRef)
}

export function isUpdateFor<T extends PersistentEntity>(entity: T, update: EntityUpdateData): boolean {
	const typeRef = entity._type as TypeRef<T>
	return isSameTypeRef(typeRef, update.typeRef) && isSameId([update.instanceListId, update.instanceId], entity._id)
}

export function getLogStringForEntityEvent(event: EntityUpdateData): string {
	return `event: ${getTypeString(event.typeRef)}, listId: ${event.instanceListId}, elementId: ${event.instanceId}, operation: ${event.operation}, patches: ${getLogStringForPatches(event.patches ?? [])} ;`
}

export function getLogStringForPatches(patches: Array<Patch>) {
	let message = ""
	for (const patch of patches) {
		message += "Patch Operation: " + patch.patchOperation + " Patched Attribute: " + patch.attributePath + " ;"
	}
	return message
}

export enum OnEntityUpdateReceivedPriority {
	LOW = 1,
	NORMAL = 2,
	HIGH = 3,
}

export type EntityEventsListener = {
	onEntityUpdatesReceived: (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id, isInitialSyncDone: boolean) => Promise<unknown>
	priority: OnEntityUpdateReceivedPriority
}
