import { OperationType } from "../TutanotaConstants.js"
import { EntityUpdate, Patch } from "../../entities/sys/TypeRefs.js"
import { ServerModelParsedInstance, SomeEntity } from "../EntityTypes.js"
import { AppName, getTypeString, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { isSameId } from "./EntityUtils.js"
import { ClientTypeModelResolver } from "../EntityFunctions"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

/**
 * A type similar to {@link EntityUpdate} but mapped to make it easier to work with.
 */

export type EntityUpdateData = {
	typeRef: TypeRef<any>
	instanceListId: string
	instanceId: string
	operation: OperationType
	instance: Nullable<ServerModelParsedInstance>

	// emptyList: when server did not send patchList, or empty re-write to the server database.
	// length > 0: normal case for patch
	patches: Nullable<Array<Patch>>

	/// status returned by EventInstancePrefetcher trying to download this instance
	prefetchStatus: PrefetchStatus
}

export enum PrefetchStatus {
	NotPrefetched = "NotPrefetched",
	Prefetched = "Prefetched",
	NotAvailable = "NotAvailable", // 403 (not authorized), 404 (not found)
}

export async function entityUpdateToUpdateData(
	clientTypeModelResolver: ClientTypeModelResolver,
	update: EntityUpdate,
	instance: Nullable<ServerModelParsedInstance> = null,
	prefetchStatus: PrefetchStatus = PrefetchStatus.NotPrefetched,
): Promise<EntityUpdateData> {
	const typeId = update.typeId ? parseInt(update.typeId) : null
	const typeIdOfEntityUpdateType = typeId
		? new TypeRef<SomeEntity>(update.application as AppName, typeId)
		: clientTypeModelResolver.resolveTypeRefFromAppAndTypeNameLegacy(update.application as AppName, update.type)

	return {
		typeRef: typeIdOfEntityUpdateType,
		instanceListId: update.instanceListId,
		instanceId: update.instanceId,
		operation: update.operation as OperationType,
		patches: update.patch?.patches ?? null,
		instance,
		prefetchStatus,
	}
}

export function isUpdateForTypeRef(typeRef: TypeRef<unknown>, update: EntityUpdateData): boolean {
	return isSameTypeRef(typeRef, update.typeRef)
}

export function isUpdateFor<T extends SomeEntity>(entity: T, update: EntityUpdateData): boolean {
	const typeRef = entity._type as TypeRef<T>
	return (
		isSameTypeRef(typeRef, update.typeRef) &&
		(update.instanceListId === "" ? isSameId(update.instanceId, entity._id) : isSameId([update.instanceListId, update.instanceId], entity._id))
	)
}

export function getLogStringForEntityEvent(event: EntityUpdateData): string {
	return `event: ${getTypeString(event.typeRef)}, listId: ${event.instanceListId}, elementId: ${event.instanceId}, prefetchStatus: ${event.prefetchStatus}, operation: ${event.operation}, patches: ${getLogStringForPatches(event.patches ?? [])} ;`
}

export function getLogStringForPatches(patches: Array<Patch>) {
	let message = ""
	for (const patch of patches) {
		message += "Patch Operation: " + patch.patchOperation + " Patched Attribute: " + patch.attributePath + " ;"
	}
	return message
}
