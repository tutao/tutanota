import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PriceRequestDataTypeRef: TypeRef<PriceRequestData> = new TypeRef("sys", "PriceRequestData")
export const _TypeModel: TypeModel = {
	"name": "PriceRequestData",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 836,
	"rootId": "A3N5cwADRA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 837,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accountType": {
			"id": 842,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"business": {
			"id": 840,
			"type": "Boolean",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"count": {
			"id": 839,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"id": 838,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentInterval": {
			"id": 841,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"reactivate": {
			"id": 1285,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createPriceRequestData(values?: Partial<PriceRequestData>): PriceRequestData {
	return Object.assign(create(_TypeModel, PriceRequestDataTypeRef), downcast<PriceRequestData>(values))
}

export type PriceRequestData = {
	_type: TypeRef<PriceRequestData>;

	_id: Id;
	accountType: null | NumberString;
	business: null | boolean;
	count: NumberString;
	featureType: NumberString;
	paymentInterval: null | NumberString;
	reactivate: boolean;
}