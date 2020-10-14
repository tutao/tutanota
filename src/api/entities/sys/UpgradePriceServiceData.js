// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const UpgradePriceServiceDataTypeRef: TypeRef<UpgradePriceServiceData> = new TypeRef("sys", "UpgradePriceServiceData")
export const _TypeModel: TypeModel = {
	"name": "UpgradePriceServiceData",
	"since": 39,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1456,
	"rootId": "A3N5cwAFsA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1457,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"name": "campaign",
			"id": 1459,
			"since": 39,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 1458,
			"since": 39,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createUpgradePriceServiceData(values?: $Shape<$Exact<UpgradePriceServiceData>>): UpgradePriceServiceData {
	return Object.assign(create(_TypeModel, UpgradePriceServiceDataTypeRef), values)
}

export type UpgradePriceServiceData = {
	_type: TypeRef<UpgradePriceServiceData>;

	_format: NumberString;
	campaign: ?string;
	date: ?Date;
}