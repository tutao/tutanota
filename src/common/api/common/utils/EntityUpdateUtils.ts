import { OperationType } from "../TutanotaConstants.js"
import { EntityUpdate, Patch } from "../../entities/sys/TypeRefs.js"
import { ServerModelParsedInstance, SomeEntity } from "../EntityTypes.js"
import { AppName, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
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

	/// whether EventInstancePrefetcher download this instance already or not
	isPrefetched: boolean
}

export async function entityUpdateToUpdateData(
	clientTypeModelResolver: ClientTypeModelResolver,
	update: EntityUpdate,
	instance: Nullable<ServerModelParsedInstance> = null,
	isPrefetched: boolean = false,
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
		isPrefetched,
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

export function containsEventOfType(events: ReadonlyArray<EntityUpdateData>, operationType: OperationType, elementId: Id): boolean {
	return events.some((event) => event.operation === operationType && event.instanceId === elementId)
}

export function getEventOfType<T extends EntityUpdateData | EntityUpdate>(events: ReadonlyArray<T>, type: OperationType, elementId: Id): T | null {
	return events.find((event) => event.operation === type && event.instanceId === elementId) ?? null
}

export function getEntityUpdateId(update: EntityUpdateData): Id | IdTuple {
	if (update.instanceListId !== "") {
		return [update.instanceListId, update.instanceId]
	} else {
		return update.instanceId
	}
}
