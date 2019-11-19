// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", "Invoice")
export const _TypeModel: TypeModel = {
	"name": "Invoice",
	"since": 52,
	"type": "ELEMENT_TYPE",
	"id": 1621,
	"rootId": "A3N5cwAGVQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 1625, "since": 52, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1623, "since": 52, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1627,
			"since": 52,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1626,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1624,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {"name": "address", "id": 1632, "since": 52, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"business": {
			"name": "business",
			"id": 1633,
			"since": 52,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"country": {"name": "country", "id": 1631, "since": 52, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"date": {"name": "date", "id": 1629, "since": 52, "type": "Date", "cardinality": "One", "final": false, "encrypted": true},
		"grandTotal": {
			"name": "grandTotal",
			"id": 1638,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"paymentMethod": {
			"name": "paymentMethod",
			"id": 1630,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"subTotal": {
			"name": "subTotal",
			"id": 1637,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {"name": "type", "id": 1628, "since": 52, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"vat": {"name": "vat", "id": 1636, "since": 52, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"vatIdNumber": {
			"name": "vatIdNumber",
			"id": 1634,
			"since": 52,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"vatRate": {"name": "vatRate", "id": 1635, "since": 52, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1639,
			"since": 52,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InvoiceItem",
			"final": false
		},
		"bookings": {
			"name": "bookings",
			"id": 1641,
			"since": 52,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Booking",
			"final": true,
			"external": false
		},
		"customer": {
			"name": "customer",
			"id": 1640,
			"since": 52,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "52"
}

export function createInvoice(values?: $Shape<$Exact<Invoice>>): Invoice {
	return Object.assign(create(_TypeModel, InvoiceTypeRef), values)
}
