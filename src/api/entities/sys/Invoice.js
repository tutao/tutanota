// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {InvoiceItem} from "./InvoiceItem"

export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", "Invoice")
export const _TypeModel: TypeModel = {
	"name": "Invoice",
	"since": 52,
	"type": "ELEMENT_TYPE",
	"id": 1650,
	"rootId": "A3N5cwAGcg",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1654,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1652,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1656,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1655,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1653,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {
			"id": 1661,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"adminUser": {
			"id": 1668,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"business": {
			"id": 1662,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"country": {
			"id": 1660,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"date": {
			"id": 1658,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"grandTotal": {
			"id": 1667,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"paymentMethod": {
			"id": 1659,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"reason": {
			"id": 1669,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"subTotal": {
			"id": 1666,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"type": {
			"id": 1657,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"vat": {
			"id": 1665,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"vatIdNumber": {
			"id": 1663,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"vatRate": {
			"id": 1664,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"items": {
			"id": 1670,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "InvoiceItem"
		},
		"bookings": {
			"id": 1672,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Booking"
		},
		"customer": {
			"id": 1671,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createInvoice(values?: $Shape<$Exact<Invoice>>): Invoice {
	return Object.assign(create(_TypeModel, InvoiceTypeRef), values)
}

export type Invoice = {
	_type: TypeRef<Invoice>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	address: string;
	adminUser: ?string;
	business: boolean;
	country: string;
	date: Date;
	grandTotal: NumberString;
	paymentMethod: NumberString;
	reason: ?string;
	subTotal: NumberString;
	type: NumberString;
	vat: NumberString;
	vatIdNumber: ?string;
	vatRate: NumberString;

	items: InvoiceItem[];
	bookings: IdTuple[];
	customer: Id;
}