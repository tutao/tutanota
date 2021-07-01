// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 432,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceToken": {
			"id": 434,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"id": 433,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "69"
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