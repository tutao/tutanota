import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 1457,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"id": 1459,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 1458,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createUpgradePriceServiceData(values?: Partial<UpgradePriceServiceData>): UpgradePriceServiceData {
	return Object.assign(create(_TypeModel, UpgradePriceServiceDataTypeRef), downcast<UpgradePriceServiceData>(values))
}

export type UpgradePriceServiceData = {
	_type: TypeRef<UpgradePriceServiceData>;

	_format: NumberString;
	campaign: null | string;
	date: null | Date;
}