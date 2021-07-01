// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const UserIdReturnTypeRef: TypeRef<UserIdReturn> = new TypeRef("sys", "UserIdReturn")
export const _TypeModel: TypeModel = {
	"name": "UserIdReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 427,
	"rootId": "A3N5cwABqw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 428,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"id": 429,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createUserIdReturn(values?: $Shape<$Exact<UserIdReturn>>): UserIdReturn {
	return Object.assign(create(_TypeModel, UserIdReturnTypeRef), values)
}

export type UserIdReturn = {
	_type: TypeRef<UserIdReturn>;

	_format: NumberString;

	userId: Id;
}