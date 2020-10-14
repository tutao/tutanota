// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {BookingItem} from "./BookingItem"

export const BookingTypeRef: TypeRef<Booking> = new TypeRef("sys", "Booking")
export const _TypeModel: TypeModel = {
	"name": "Booking",
	"since": 9,
	"type": "LIST_ELEMENT_TYPE",
	"id": 709,
	"rootId": "A3N5cwACxQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_area": {
			"name": "_area",
			"id": 715,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"name": "_format",
			"id": 713,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 711,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"name": "_owner",
			"id": 714,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1004,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 712,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"business": {
			"name": "business",
			"id": 720,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"createDate": {
			"name": "createDate",
			"id": 716,
			"since": 9,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"endDate": {
			"name": "endDate",
			"id": 718,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"paymentInterval": {
			"name": "paymentInterval",
			"id": 719,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMonths": {
			"name": "paymentMonths",
			"id": 717,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 721,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "BookingItem",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createBooking(values?: $Shape<$Exact<Booking>>): Booking {
	return Object.assign(create(_TypeModel, BookingTypeRef), values)
}

export type Booking = {
	_type: TypeRef<Booking>;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	business: boolean;
	createDate: Date;
	endDate: ?Date;
	paymentInterval: NumberString;
	paymentMonths: NumberString;

	items: BookingItem[];
}