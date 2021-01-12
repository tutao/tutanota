// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 458,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recipient": {
			"id": 460,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sender": {
			"id": 459,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"text": {
			"id": 461,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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