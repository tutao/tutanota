import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 50,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 993,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 51,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"time": {
			"id": 53,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createLogin(values?: Partial<Login>): Login {
	return Object.assign(create(_TypeModel, LoginTypeRef), downcast<Login>(values))
}

export type Login = {
	_type: TypeRef<Login>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	time: Date;
}