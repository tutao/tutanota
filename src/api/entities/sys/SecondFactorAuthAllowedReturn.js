// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", "SecondFactorAuthAllowedReturn")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthAllowedReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 546,
	"rootId": "A3N5cwACIg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 547,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"allowed": {
			"id": 548,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createSecondFactorAuthAllowedReturn(values?: $Shape<$Exact<SecondFactorAuthAllowedReturn>>): SecondFactorAuthAllowedReturn {
	return Object.assign(create(_TypeModel, SecondFactorAuthAllowedReturnTypeRef), values)
}

export type SecondFactorAuthAllowedReturn = {
	_type: TypeRef<SecondFactorAuthAllowedReturn>;

	_format: NumberString;
	allowed: boolean;
}