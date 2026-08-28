import { idToElementId } from "./EntityUtils"

import { AnyEntityId } from "./EntityTypes"
import { isNotNull, Nullable } from "@tutao/utils"

export function collapseId(listId: Id | null, elementId: Id): AnyEntityId {
	if (isNotNull(listId)) {
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
