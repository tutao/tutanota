import { OperationType } from "../TutanotaConstants.js"
import { EntityUpdate } from "../../entities/sys/TypeRefs.js"
import { SomeEntity } from "../EntityTypes.js"
import { AppName, isSameTypeRefByAttr, TypeRef } from "@tutao/tutanota-utils"
import { isSameId } from "./EntityUtils.js"
import { resolveTypeRefFromAppAndTypeNameLegacy } from "../EntityFunctions"

export type EntityUpdateData = {
	application: string
	typeId: number | null
	type: string
	instanceListId: string
	instanceId: string
	operation: OperationType
}

export function entityUpdateToUpdateData(update: EntityUpdate): EntityUpdateData {
	return {
		application: update.application,
		typeId: update.typeId ? parseInt(update.typeId) : null,
		type: update.type,
		instanceListId: update.instanceListId,
		instanceId: update.instanceId,
		operation: update.operation as OperationType,
	}
}

export function isUpdateForTypeRef(typeRef: TypeRef<unknown>, update: EntityUpdateData | EntityUpdate): boolean {
	const typeId = typeof update.typeId === "number" ? update.typeId : update.typeId ? parseInt(update.typeId) : null
	const typeIdOfEntityUpdateType = typeId ? typeId : resolveTypeRefFromAppAndTypeNameLegacy(update.application as AppName, update.type).typeId
	return isSameTypeRefByAttr(typeRef, update.application, typeIdOfEntityUpdateType)
}

export function isUpdateFor<T extends SomeEntity>(entity: T, update: EntityUpdateData): boolean {
	const typeRef = entity._type as TypeRef<T>
	return (
		isUpdateForTypeRef(typeRef, update) &&
		(update.instanceListId === "" ? isSameId(update.instanceId, entity._id) : isSameId([update.instanceListId, update.instanceId], entity._id))
	)
}

export function containsEventOfType(events: ReadonlyArray<EntityUpdateData>, operationType: OperationType, elementId: Id): boolean {
	return events.some((event) => event.operation === operationType && event.instanceId === elementId)
}

export function getEventOfType<T extends EntityUpdateData | EntityUpdate>(events: ReadonlyArray<T>, type: OperationType, elementId: Id): T | null {
	return events.find((event) => event.operation === type && event.instanceId === elementId) ?? null
}
