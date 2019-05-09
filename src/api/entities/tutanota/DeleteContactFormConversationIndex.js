// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteContactFormConversationIndexTypeRef: TypeRef<DeleteContactFormConversationIndex> = new TypeRef("tutanota", "DeleteContactFormConversationIndex")
export const _TypeModel: TypeModel = {
	"name": "DeleteContactFormConversationIndex",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 839,
	"rootId": "CHR1dGFub3RhAANH",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 840, "since": 22, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"items": {
			"name": "items",
			"id": 841,
			"since": 22,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "DeleteContactFormConversationIndexEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createDeleteContactFormConversationIndex(): DeleteContactFormConversationIndex {
	return create(_TypeModel, DeleteContactFormConversationIndexTypeRef)
}
