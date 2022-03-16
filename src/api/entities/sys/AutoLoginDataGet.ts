import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createAutoLoginDataGet(values?: Partial<AutoLoginDataGet>): AutoLoginDataGet {
	return Object.assign(create(_TypeModel, AutoLoginDataGetTypeRef), downcast<AutoLoginDataGet>(values))
}

export type AutoLoginDataGet = {
	_type: TypeRef<AutoLoginDataGet>;

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}