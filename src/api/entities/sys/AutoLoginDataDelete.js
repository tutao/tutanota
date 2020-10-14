// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 436,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"name": "deviceToken",
			"id": 437,
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

export function createAutoLoginDataDelete(values?: $Shape<$Exact<AutoLoginDataDelete>>): AutoLoginDataDelete {
	return Object.assign(create(_TypeModel, AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;

	_format: NumberString;
	deviceToken: string;
}