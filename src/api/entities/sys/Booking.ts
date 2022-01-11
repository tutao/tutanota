import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BookingItem} from "./BookingItem.js"

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
			"id": 715,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"id": 713,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 711,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"id": 714,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1004,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 712,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"business": {
			"id": 720,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"createDate": {
			"id": 716,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"endDate": {
			"id": 718,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"paymentInterval": {
			"id": 719,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMonths": {
			"id": 717,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 721,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "BookingItem",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "71"
}

export function createBooking(values?: Partial<Booking>): Booking {
	return Object.assign(create(_TypeModel, BookingTypeRef), downcast<Booking>(values))
}

export type Booking = {
	_type: TypeRef<Booking>;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	business: boolean;
	createDate: Date;
	endDate: null | Date;
	paymentInterval: NumberString;
	paymentMonths: NumberString;

	items: BookingItem[];
}