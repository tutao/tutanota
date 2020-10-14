// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1654,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1652,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1656,
			"since": 52,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1655,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1653,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {
			"name": "address",
			"id": 1661,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"adminUser": {
			"name": "adminUser",
			"id": 1668,
			"since": 52,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"business": {
			"name": "business",
			"id": 1662,
			"since": 52,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"country": {
			"name": "country",
			"id": 1660,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"date": {
			"name": "date",
			"id": 1658,
			"since": 52,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"grandTotal": {
			"name": "grandTotal",
			"id": 1667,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"paymentMethod": {
			"name": "paymentMethod",
			"id": 1659,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"reason": {
			"name": "reason",
			"id": 1669,
			"since": 52,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"subTotal": {
			"name": "subTotal",
			"id": 1666,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"type": {
			"name": "type",
			"id": 1657,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"vat": {
			"name": "vat",
			"id": 1665,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"vatIdNumber": {
			"name": "vatIdNumber",
			"id": 1663,
			"since": 52,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"vatRate": {
			"name": "vatRate",
			"id": 1664,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1670,
			"since": 52,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InvoiceItem",
			"final": true
		},
		"bookings": {
			"name": "bookings",
			"id": 1672,
			"since": 52,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Booking",
			"final": true,
			"external": false
		},
		"customer": {
			"name": "customer",
			"id": 1671,
			"since": 52,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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