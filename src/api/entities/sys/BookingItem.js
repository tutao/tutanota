// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 701,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"currentCount": {
			"name": "currentCount",
			"id": 703,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"currentInvoicedCount": {
			"name": "currentInvoicedCount",
			"id": 706,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"name": "featureType",
			"id": 702,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"maxCount": {
			"name": "maxCount",
			"id": 704,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"name": "price",
			"id": 707,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"priceType": {
			"name": "priceType",
			"id": 708,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"totalInvoicedCount": {
			"name": "totalInvoicedCount",
			"id": 705,
			"since": 9,
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