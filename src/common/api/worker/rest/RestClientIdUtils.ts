import type { TypeModel } from "../../common/EntityTypes"
import { Type } from "../../common/EntityConstants"

export function collapseId(listId: Id | null, elementId: Id): Id | IdTuple {
	if (listId != null) {
		return [listId, elementId]
	} else {
		return elementId
	}
}

export function getIds(
	instance: any,
	typeModel: TypeModel,
): {
	listId: string | null
	id: string
} {
	if (!instance._id) throw new Error("Id must be defined")
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

export function expandId(id: Id | IdTuple): { listId: Id | null; elementId: Id } {
	if (typeof id === "string") {
		return {
			listId: null,
			elementId: id,
		}
	} else {
		const [listId, elementId] = id
		return {
			listId,
			elementId,
		}
	}
}
