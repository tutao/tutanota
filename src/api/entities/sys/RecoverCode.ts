import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1411,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1409,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1412,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1410,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recoverCodeEncUserGroupKey": {
			"id": 1414,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"userEncRecoverCode": {
			"id": 1413,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"verifier": {
			"id": 1415,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createRecoverCode(values?: Partial<RecoverCode>): RecoverCode {
	return Object.assign(create(_TypeModel, RecoverCodeTypeRef), downcast<RecoverCode>(values))
}

export type RecoverCode = {
	_type: TypeRef<RecoverCode>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	recoverCodeEncUserGroupKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	verifier: Uint8Array;
}