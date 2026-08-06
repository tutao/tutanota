import { idToElementId } from "./EntityUtils"

import { AnyEntityId } from "./EntityTypes"
import { Nullable } from "@tutao/utils"

export function collapseId(listId: Id | null, elementId: Id): AnyEntityId {
	if (listId != null) {
		return [listId, elementId]
	} else {
		return idToElementId(elementId)
	}
}

export type ExpandedId = {
	listId: Nullable<Id>
	elementId: Id
}
export function expandId(id: AnyEntityId): ExpandedId {
	return {
		listId: id[0],
		elementId: id[1],
	}
}
