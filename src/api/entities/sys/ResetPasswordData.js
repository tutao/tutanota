// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 585,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"id": 588,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 587,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 586,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 589,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
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