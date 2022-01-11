import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "71"
}

export function createAutoLoginDataDelete(values?: Partial<AutoLoginDataDelete>): AutoLoginDataDelete {
	return Object.assign(create(_TypeModel, AutoLoginDataDeleteTypeRef), downcast<AutoLoginDataDelete>(values))
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;

	_format: NumberString;
	deviceToken: string;
}