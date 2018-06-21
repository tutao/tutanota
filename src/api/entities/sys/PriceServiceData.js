// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", "PriceServiceData")
export const _TypeModel: TypeModel = {
	"name": "PriceServiceData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 843,
	"rootId": "A3N5cwADSw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 844,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 846,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"priceRequest": {
			"name": "priceRequest",
			"id": 845,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PriceRequestData",
			"final": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createPriceServiceData(): PriceServiceData {
	return create(_TypeModel)
}
