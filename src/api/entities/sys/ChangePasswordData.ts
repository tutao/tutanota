import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const ChangePasswordDataTypeRef: TypeRef<ChangePasswordData> = new TypeRef("sys", "ChangePasswordData")
export const _TypeModel: TypeModel = {
	"name": "ChangePasswordData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 534,
	"rootId": "A3N5cwACFg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 535,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"id": 539,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"oldVerifier": {
			"id": 1240,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"id": 538,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"id": 1418,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"id": 537,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 536,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createChangePasswordData(values?: Partial<ChangePasswordData>): ChangePasswordData {
	return Object.assign(create(_TypeModel, ChangePasswordDataTypeRef), downcast<ChangePasswordData>(values))
}

export type ChangePasswordData = {
	_type: TypeRef<ChangePasswordData>;

	_format: NumberString;
	code: null | string;
	oldVerifier: null | Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: null | Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;
}