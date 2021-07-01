// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", "AutoLoginPostReturn")
export const _TypeModel: TypeModel = {
	"name": "AutoLoginPostReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 441,
	"rootId": "A3N5cwABuQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 442,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"id": 443,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createAutoLoginPostReturn(values?: $Shape<$Exact<AutoLoginPostReturn>>): AutoLoginPostReturn {
	return Object.assign(create(_TypeModel, AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;

	_format: NumberString;
	deviceToken: string;
}