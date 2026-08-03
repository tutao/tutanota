import { idToElementId } from "./EntityUtils"

import { AnyEntityId } from "./EntityTypes"

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
