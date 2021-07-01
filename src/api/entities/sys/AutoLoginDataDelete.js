// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", "AutoLoginDataDelete")
export const _TypeModel: TypeModel = {
	"name": "AutoLoginDataDelete",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 435,
	"rootId": "A3N5cwABsw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 436,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"id": 437,
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

export function createAutoLoginDataDelete(values?: $Shape<$Exact<AutoLoginDataDelete>>): AutoLoginDataDelete {
	return Object.assign(create(_TypeModel, AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;

	_format: NumberString;
	deviceToken: string;
}