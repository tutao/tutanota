// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 120,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 118,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 588,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 119,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"conversationType": {
			"id": 122,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"messageId": {
			"id": 121,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"mail": {
			"id": 124,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Mail"
		},
		"previous": {
			"id": 123,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ConversationEntry"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createConversationEntry(values?: $Shape<$Exact<ConversationEntry>>): ConversationEntry {
	return Object.assign(create(_TypeModel, ConversationEntryTypeRef), values)
}

export type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	conversationType: NumberString;
	messageId: string;

	mail: ?IdTuple;
	previous: ?IdTuple;
}