// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", "SecondFactorAuthGetData")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthGetData",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1233,
	"rootId": "A3N5cwAE0Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1234,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessToken": {
			"id": 1235,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createSecondFactorAuthGetData(values?: $Shape<$Exact<SecondFactorAuthGetData>>): SecondFactorAuthGetData {
	return Object.assign(create(_TypeModel, SecondFactorAuthGetDataTypeRef), values)
}

export type SecondFactorAuthGetData = {
	_type: TypeRef<SecondFactorAuthGetData>;

	_format: NumberString;
	accessToken: string;
}