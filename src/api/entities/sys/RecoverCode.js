// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", "RecoverCode")
export const _TypeModel: TypeModel = {
	"name": "RecoverCode",
	"since": 36,
	"type": "ELEMENT_TYPE",
	"id": 1407,
	"rootId": "A3N5cwAFfw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1411,
			"since": 36,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1409,
			"since": 36,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1412,
			"since": 36,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1410,
			"since": 36,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recoverCodeEncUserGroupKey": {
			"name": "recoverCodeEncUserGroupKey",
			"id": 1414,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"userEncRecoverCode": {
			"name": "userEncRecoverCode",
			"id": 1413,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 1415,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRecoverCode(values?: $Shape<$Exact<RecoverCode>>): RecoverCode {
	return Object.assign(create(_TypeModel, RecoverCodeTypeRef), values)
}

export type RecoverCode = {
	_type: TypeRef<RecoverCode>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	recoverCodeEncUserGroupKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	verifier: Uint8Array;
}