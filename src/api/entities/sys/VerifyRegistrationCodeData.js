// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", "VerifyRegistrationCodeData")
export const _TypeModel: TypeModel = {
	"name": "VerifyRegistrationCodeData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 351,
	"rootId": "A3N5cwABXw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 352,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 353,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"id": 354,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createVerifyRegistrationCodeData(values?: $Shape<$Exact<VerifyRegistrationCodeData>>): VerifyRegistrationCodeData {
	return Object.assign(create(_TypeModel, VerifyRegistrationCodeDataTypeRef), values)
}

export type VerifyRegistrationCodeData = {
	_type: TypeRef<VerifyRegistrationCodeData>;

	_format: NumberString;
	authToken: string;
	code: string;
}