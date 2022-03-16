import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const WhitelabelChildTypeRef: TypeRef<WhitelabelChild> = new TypeRef("sys", "WhitelabelChild")
export const _TypeModel: TypeModel = {
	"name": "WhitelabelChild",
	"since": 26,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1257,
	"rootId": "A3N5cwAE6Q",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1261,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1259,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1263,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1262,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1260,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"comment": {
			"id": 1267,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"createdDate": {
			"id": 1265,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deletedDate": {
			"id": 1266,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1264,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"id": 1268,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createWhitelabelChild(values?: Partial<WhitelabelChild>): WhitelabelChild {
	return Object.assign(create(_TypeModel, WhitelabelChildTypeRef), downcast<WhitelabelChild>(values))
}

export type WhitelabelChild = {
	_type: TypeRef<WhitelabelChild>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	comment: string;
	createdDate: Date;
	deletedDate: null | Date;
	mailAddress: string;

	customer: Id;
}