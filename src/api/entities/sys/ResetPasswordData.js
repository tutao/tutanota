// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const ResetPasswordDataTypeRef: TypeRef<ResetPasswordData> = new TypeRef("sys", "ResetPasswordData")
export const _TypeModel: TypeModel = {
	"name": "ResetPasswordData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 584,
	"rootId": "A3N5cwACSA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 585,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"name": "pwEncUserGroupKey",
			"id": 588,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 587,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 586,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"id": 589,
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

export function createResetPasswordData(values?: $Shape<$Exact<ResetPasswordData>>): ResetPasswordData {
	return Object.assign(create(_TypeModel, ResetPasswordDataTypeRef), values)
}

export type ResetPasswordData = {
	_type: TypeRef<ResetPasswordData>;

	_format: NumberString;
	pwEncUserGroupKey: Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;

	user: Id;
}