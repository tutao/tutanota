// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 837,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 842,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"business": {
			"name": "business",
			"id": 840,
			"since": 9,
			"type": "Boolean",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"count": {
			"name": "count",
			"id": 839,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"name": "featureType",
			"id": 838,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentInterval": {
			"name": "paymentInterval",
			"id": 841,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"reactivate": {
			"name": "reactivate",
			"id": 1285,
			"since": 26,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPriceRequestData(values?: $Shape<$Exact<PriceRequestData>>): PriceRequestData {
	return Object.assign(create(_TypeModel, PriceRequestDataTypeRef), values)
}

export type PriceRequestData = {
	_type: TypeRef<PriceRequestData>;

	_id: Id;
	accountType: ?NumberString;
	business: ?boolean;
	count: NumberString;
	featureType: NumberString;
	paymentInterval: ?NumberString;
	reactivate: boolean;
}