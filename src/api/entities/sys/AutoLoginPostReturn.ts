import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "74"
}

export function createAutoLoginPostReturn(values?: Partial<AutoLoginPostReturn>): AutoLoginPostReturn {
	return Object.assign(create(_TypeModel, AutoLoginPostReturnTypeRef), downcast<AutoLoginPostReturn>(values))
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;

	_format: NumberString;
	deviceToken: string;
}