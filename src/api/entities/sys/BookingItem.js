// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const BookingItemTypeRef: TypeRef<BookingItem> = new TypeRef("sys", "BookingItem")
export const _TypeModel: TypeModel = {
	"name": "BookingItem",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 700,
	"rootId": "A3N5cwACvA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 701,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"currentCount": {
			"id": 703,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"currentInvoicedCount": {
			"id": 706,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"id": 702,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"maxCount": {
			"id": 704,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"id": 707,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"priceType": {
			"id": 708,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"totalInvoicedCount": {
			"id": 705,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createBookingItem(values?: $Shape<$Exact<BookingItem>>): BookingItem {
	return Object.assign(create(_TypeModel, BookingItemTypeRef), values)
}

export type BookingItem = {
	_type: TypeRef<BookingItem>;

	_id: Id;
	currentCount: NumberString;
	currentInvoicedCount: NumberString;
	featureType: NumberString;
	maxCount: NumberString;
	price: NumberString;
	priceType: NumberString;
	totalInvoicedCount: NumberString;
}