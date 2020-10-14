// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 405,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 879,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"name": "restore",
			"id": 406,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"id": 407,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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