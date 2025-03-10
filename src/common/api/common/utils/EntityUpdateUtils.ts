import { OperationType } from "../TutanotaConstants.js"
import { EntityUpdate } from "../../entities/sys/TypeRefs.js"
import { SomeEntity } from "../EntityTypes.js"
import { isSameTypeRefByAttr, TypeRef } from "@tutao/tutanota-utils"
import { isSameId } from "./EntityUtils.js"

export type EntityUpdateData = {
	application: string
	typeId: number
	instanceListId: string
	instanceId: string
	operation: OperationType
}

export function entityUpateToUpdateData(update: EntityUpdate): EntityUpdateData {
	return {
		typeId: parseInt(update.typeId),
		application: update.application,
		instanceId: update.instanceId,
		instanceListId: update.instanceListId,
		operation: update.operation as OperationType,
	}
}

export function isUpdateForTypeRef(typeRef: TypeRef<unknown>, update: EntityUpdateData | EntityUpdate): boolean {
	const typeId = typeof update.typeId === "number" ? update.typeId : parseInt(update.typeId)
	return isSameTypeRefByAttr(typeRef, update.application, typeId)
}

export function isUpdateFor<T extends SomeEntity>(entity: T, update: EntityUpdateData): boolean {
	const typeRef = entity._type as TypeRef<T>
	return (
		isUpdateForTypeRef(typeRef, update) &&
		(update.instanceListId === "" ? isSameId(update.instanceId, entity._id) : isSameId([update.instanceListId, update.instanceId], entity._id))
	)
}

export function containsEventOfType(events: ReadonlyArray<EntityUpdateData>, type: OperationType, elementId: Id): boolean {
	return events.some((event) => event.operation === type && event.instanceId === elementId)
}

export function getEventOfType<T extends EntityUpdateData | EntityUpdate>(events: ReadonlyArray<T>, type: OperationType, elementId: Id): T | null {
	return events.find((event) => event.operation === type && event.instanceId === elementId) ?? null
}
