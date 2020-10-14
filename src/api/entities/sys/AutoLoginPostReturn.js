// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 442,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"name": "deviceToken",
			"id": 443,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createAutoLoginPostReturn(values?: $Shape<$Exact<AutoLoginPostReturn>>): AutoLoginPostReturn {
	return Object.assign(create(_TypeModel, AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;

	_format: NumberString;
	deviceToken: string;
}