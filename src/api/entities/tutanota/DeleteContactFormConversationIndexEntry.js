// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 836,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 834,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 837,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 835,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createDeleteContactFormConversationIndexEntry(values?: $Shape<$Exact<DeleteContactFormConversationIndexEntry>>): DeleteContactFormConversationIndexEntry {
	return Object.assign(create(_TypeModel, DeleteContactFormConversationIndexEntryTypeRef), values)
}

export type DeleteContactFormConversationIndexEntry = {
	_type: TypeRef<DeleteContactFormConversationIndexEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
}