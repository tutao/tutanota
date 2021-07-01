// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", "AutoLoginDataReturn")
export const _TypeModel: TypeModel = {
	"name": "AutoLoginDataReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 438,
	"rootId": "A3N5cwABtg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 439,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceKey": {
			"id": 440,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createAutoLoginDataReturn(values?: $Shape<$Exact<AutoLoginDataReturn>>): AutoLoginDataReturn {
	return Object.assign(create(_TypeModel, AutoLoginDataReturnTypeRef), values)
}

export type AutoLoginDataReturn = {
	_type: TypeRef<AutoLoginDataReturn>;

	_format: NumberString;
	deviceKey: Uint8Array;
}