// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteContactFormConversationIndexTypeRef: TypeRef<DeleteContactFormConversationIndex> = new TypeRef("tutanota", "DeleteContactFormConversationIndex")
export const _TypeModel: TypeModel = {
	"name": "DeleteContactFormConversationIndex",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 838,
	"rootId": "CHR1dGFub3RhAANG",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 839,
			"since": 22,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"since": 22,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "DeleteContactFormConversationIndexEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "22"
}

export function createDeleteContactFormConversationIndex(): DeleteContactFormConversationIndex {
	return create(_TypeModel)
}
