// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const BookingServiceDataTypeRef: TypeRef<BookingServiceData> = new TypeRef("sys", "BookingServiceData")
export const _TypeModel: TypeModel = {
	"name": "BookingServiceData",
	"since": 18,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1061,
	"rootId": "A3N5cwAEJQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1062,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"amount": {
			"id": 1064,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 1065,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"id": 1063,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createBookingServiceData(values?: $Shape<$Exact<BookingServiceData>>): BookingServiceData {
	return Object.assign(create(_TypeModel, BookingServiceDataTypeRef), values)
}

export type BookingServiceData = {
	_type: TypeRef<BookingServiceData>;

	_format: NumberString;
	amount: NumberString;
	date: ?Date;
	featureType: NumberString;
}