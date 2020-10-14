// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 773,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 774,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"name": "campaign",
			"id": 1454,
			"since": 38,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 775,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"subscriptionType": {
			"name": "subscriptionType",
			"id": 1310,
			"since": 30,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createSwitchAccountTypeData(values?: $Shape<$Exact<SwitchAccountTypeData>>): SwitchAccountTypeData {
	return Object.assign(create(_TypeModel, SwitchAccountTypeDataTypeRef), values)
}

export type SwitchAccountTypeData = {
	_type: TypeRef<SwitchAccountTypeData>;

	_format: NumberString;
	accountType: NumberString;
	campaign: ?string;
	date: ?Date;
	subscriptionType: NumberString;
}