// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", "UserDataDelete")
export const _TypeModel: TypeModel = {
	"name": "UserDataDelete",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 404,
	"rootId": "A3N5cwABlA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 405,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 879,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"id": 406,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 407,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createUserDataDelete(values?: $Shape<$Exact<UserDataDelete>>): UserDataDelete {
	return Object.assign(create(_TypeModel, UserDataDeleteTypeRef), values)
}

export type UserDataDelete = {
	_type: TypeRef<UserDataDelete>;

	_format: NumberString;
	date: ?Date;
	restore: boolean;

	user: Id;
}