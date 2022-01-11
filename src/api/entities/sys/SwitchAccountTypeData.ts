import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const SwitchAccountTypeDataTypeRef: TypeRef<SwitchAccountTypeData> = new TypeRef("sys", "SwitchAccountTypeData")
export const _TypeModel: TypeModel = {
	"name": "SwitchAccountTypeData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 772,
	"rootId": "A3N5cwADBA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 773,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"id": 774,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"id": 1454,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 775,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"subscriptionType": {
			"id": 1310,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createSwitchAccountTypeData(values?: Partial<SwitchAccountTypeData>): SwitchAccountTypeData {
	return Object.assign(create(_TypeModel, SwitchAccountTypeDataTypeRef), downcast<SwitchAccountTypeData>(values))
}

export type SwitchAccountTypeData = {
	_type: TypeRef<SwitchAccountTypeData>;

	_format: NumberString;
	accountType: NumberString;
	campaign: null | string;
	date: null | Date;
	subscriptionType: NumberString;
}