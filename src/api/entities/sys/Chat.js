// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const ChatTypeRef: TypeRef<Chat> = new TypeRef("sys", "Chat")
export const _TypeModel: TypeModel = {
	"name": "Chat",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 457,
	"rootId": "A3N5cwAByQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 458,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recipient": {
			"name": "recipient",
			"id": 460,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sender": {
			"name": "sender",
			"id": 459,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"text": {
			"name": "text",
			"id": 461,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createChat(values?: $Shape<$Exact<Chat>>): Chat {
	return Object.assign(create(_TypeModel, ChatTypeRef), values)
}

export type Chat = {
	_type: TypeRef<Chat>;

	_id: Id;
	recipient: Id;
	sender: Id;
	text: string;
}