// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "Customer"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createWhitelabelChild(values?: $Shape<$Exact<WhitelabelChild>>): WhitelabelChild {
	return Object.assign(create(_TypeModel, WhitelabelChildTypeRef), values)
}

export type WhitelabelChild = {
	_type: TypeRef<WhitelabelChild>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	comment: string;
	createdDate: Date;
	deletedDate: ?Date;
	mailAddress: string;

	customer: Id;
}