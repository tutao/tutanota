// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const InvoiceItemTypeRef: TypeRef<InvoiceItem> = new TypeRef("sys", "InvoiceItem")
export const _TypeModel: TypeModel = {
	"name": "InvoiceItem",
	"since": 52,
	"type": "AGGREGATED_TYPE",
	"id": 1641,
	"rootId": "A3N5cwAGaQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1642,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"amount": {
			"id": 1643,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"endDate": {
			"id": 1648,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"singlePrice": {
			"id": 1645,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"singleType": {
			"id": 1649,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"startDate": {
			"id": 1647,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"totalPrice": {
			"id": 1646,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"type": {
			"id": 1644,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createInvoiceItem(values?: $Shape<$Exact<InvoiceItem>>): InvoiceItem {
	return Object.assign(create(_TypeModel, InvoiceItemTypeRef), values)
}

export type InvoiceItem = {
	_type: TypeRef<InvoiceItem>;

	_id: Id;
	amount: NumberString;
	endDate: ?Date;
	singlePrice: ?NumberString;
	singleType: boolean;
	startDate: ?Date;
	totalPrice: NumberString;
	type: NumberString;
}