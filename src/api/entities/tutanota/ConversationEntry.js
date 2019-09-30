// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", "ConversationEntry")
export const _TypeModel: TypeModel = {
	"name": "ConversationEntry",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 84,
	"rootId": "CHR1dGFub3RhAFQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 120,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 118, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 588,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 119,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"conversationType": {
			"name": "conversationType",
			"id": 122,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"messageId": {"name": "messageId", "id": 121, "since": 1, "type": "String", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"mail": {
			"name": "mail",
			"id": 124,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Mail",
			"final": true,
			"external": false
		},
		"previous": {
			"name": "previous",
			"id": 123,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "ConversationEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createConversationEntry(values?: $Shape<$Exact<ConversationEntry>>): ConversationEntry {
	return Object.assign(create(_TypeModel, ConversationEntryTypeRef), values)
}
