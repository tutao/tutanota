// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", "Login")
export const _TypeModel: TypeModel = {
	"name": "Login",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 48,
	"rootId": "A3N5cwAw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 52,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 50,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 993,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 51,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"time": {
			"name": "time",
			"id": 53,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createLogin(values?: $Shape<$Exact<Login>>): Login {
	return Object.assign(create(_TypeModel, LoginTypeRef), values)
}

export type Login = {
	_type: TypeRef<Login>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	time: Date;
}