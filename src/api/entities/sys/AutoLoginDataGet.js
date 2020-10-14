// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const AutoLoginDataGetTypeRef: TypeRef<AutoLoginDataGet> = new TypeRef("sys", "AutoLoginDataGet")
export const _TypeModel: TypeModel = {
	"name": "AutoLoginDataGet",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 431,
	"rootId": "A3N5cwABrw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 432,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"name": "deviceToken",
			"id": 434,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"name": "userId",
			"id": 433,
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

export function createAutoLoginDataGet(values?: $Shape<$Exact<AutoLoginDataGet>>): AutoLoginDataGet {
	return Object.assign(create(_TypeModel, AutoLoginDataGetTypeRef), values)
}

export type AutoLoginDataGet = {
	_type: TypeRef<AutoLoginDataGet>;

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}