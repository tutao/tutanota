// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 535,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"name": "code",
			"id": 539,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"oldVerifier": {
			"name": "oldVerifier",
			"id": 1240,
			"since": 23,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"name": "pwEncUserGroupKey",
			"id": 538,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1418,
			"since": 36,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 537,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 536,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createChangePasswordData(values?: $Shape<$Exact<ChangePasswordData>>): ChangePasswordData {
	return Object.assign(create(_TypeModel, ChangePasswordDataTypeRef), values)
}

export type ChangePasswordData = {
	_type: TypeRef<ChangePasswordData>;

	_format: NumberString;
	code: ?string;
	oldVerifier: ?Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: ?Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;
}