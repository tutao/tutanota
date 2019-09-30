// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteContactFormConversationIndexEntryTypeRef: TypeRef<DeleteContactFormConversationIndexEntry> = new TypeRef("tutanota", "DeleteContactFormConversationIndexEntry")
export const _TypeModel: TypeModel = {
	"name": "DeleteContactFormConversationIndexEntry",
	"since": 22,
	"type": "LIST_ELEMENT_TYPE",
	"id": 832,
	"rootId": "CHR1dGFub3RhAANA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 836,
			"since": 22,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 834, "since": 22, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 837,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 835,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createDeleteContactFormConversationIndexEntry(values?: $Shape<$Exact<DeleteContactFormConversationIndexEntry>>): DeleteContactFormConversationIndexEntry {
	return Object.assign(create(_TypeModel, DeleteContactFormConversationIndexEntryTypeRef), values)
}
