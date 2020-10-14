// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1261,
			"since": 26,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1259,
			"since": 26,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1263,
			"since": 26,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1262,
			"since": 26,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1260,
			"since": 26,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"comment": {
			"name": "comment",
			"id": 1267,
			"since": 26,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"createdDate": {
			"name": "createdDate",
			"id": 1265,
			"since": 26,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deletedDate": {
			"name": "deletedDate",
			"id": 1266,
			"since": 26,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 1264,
			"since": 26,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 1268,
			"since": 26,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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