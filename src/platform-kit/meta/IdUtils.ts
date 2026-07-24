import { Type } from "./EntityConstants.js"
import { AnyEntityId, TypeModel } from "./EntityTypes.js"
import { idToElementId } from "./EntityUtils"
import { isNull } from "../utils/Utils"

export function getIdOfInstance(
	instance: any,
	typeModel: TypeModel,
): {
	listId: string | null
	id: string
} {
	if (isNull(instance._id)) throw new Error("Id must be defined")
	let listId = null
	let id

	if (typeModel.type === Type.ListElement) {
		listId = instance._id[0]
		id = instance._id[1]
	} else {
		id = instance._id
	}

	return {
		listId,
		id,
	}
}

export function collapseId(listId: Id | null, elementId: Id): AnyEntityId {
	if (listId != null) {
		return [listId, elementId]
	} else {
		return idToElementId(elementId)
	}
}

export function expandId(id: AnyEntityId): { listId: Id | null; elementId: Id } {
	return {
		listId: id[0],
		elementId: id[1],
	}
}
