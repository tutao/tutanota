import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "Mail",
			"dependency": null
		},
		"previous": {
			"id": 123,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ConversationEntry",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createConversationEntry(values?: Partial<ConversationEntry>): ConversationEntry {
	return Object.assign(create(_TypeModel, ConversationEntryTypeRef), downcast<ConversationEntry>(values))
}

export type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	conversationType: NumberString;
	messageId: string;

	mail:  null | IdTuple;
	previous:  null | IdTuple;
}