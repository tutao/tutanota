import { OperationType } from "../TutanotaConstants.js"
import { EntityUpdate } from "../../entities/sys/TypeRefs.js"
import { SomeEntity } from "../EntityTypes.js"
import { AppName, isSameTypeRef, isSameTypeRefByAttr, TypeRef } from "@tutao/tutanota-utils"
import { isSameId } from "./EntityUtils.js"
import { ClientTypeModelResolver } from "../EntityFunctions"

/**
 * A type similar to {@link EntityUpdate} but mapped to make it easier to work with.
 */
export type EntityUpdateData = {
	typeRef: TypeRef<any>
	instanceListId: string
	instanceId: string
	operation: OperationType
}

export async function entityUpdateToUpdateData(clientTypeModelResolver: ClientTypeModelResolver, update: EntityUpdate): Promise<EntityUpdateData> {
	const typeId = update.typeId ? parseInt(update.typeId) : null
	const typeIdOfEntityUpdateType = typeId
		? new TypeRef<SomeEntity>(update.application as AppName, typeId)
		: clientTypeModelResolver.resolveTypeRefFromAppAndTypeNameLegacy(update.application as AppName, update.type)
	return {
		typeRef: typeIdOfEntityUpdateType,
		instanceListId: update.instanceListId,
		instanceId: update.instanceId,
		operation: update.operation as OperationType,
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
