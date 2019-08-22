// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", "Invoice")
export const _TypeModel: TypeModel = {
	"name": "Invoice",
	"since": 9,
	"type": "LIST_ELEMENT_TYPE",
	"id": 739,
	"rootId": "A3N5cwAC4w",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 743, "since": 9, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 741, "since": 9, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_listEncSessionKey": {
			"name": "_listEncSessionKey",
			"id": 744,
			"since": 9,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1006,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1005,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 742,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"country": {"name": "country", "id": 892, "since": 10, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"date": {"name": "date", "id": 745, "since": 9, "type": "Date", "cardinality": "One", "final": false, "encrypted": true},
		"grandTotal": {
			"name": "grandTotal",
			"id": 748,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"number": {"name": "number", "id": 746, "since": 9, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"paymentMethod": {
			"name": "paymentMethod",
			"id": 751,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"source": {"name": "source", "id": 749, "since": 9, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"status": {"name": "status", "id": 750, "since": 9, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"vat": {"name": "vat", "id": 747, "since": 9, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"vatRate": {"name": "vatRate", "id": 893, "since": 10, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"bookings": {
			"name": "bookings",
			"id": 894,
			"since": 10,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Booking",
			"final": true,
			"external": false
		},
		"changes": {
			"name": "changes",
			"id": 895,
			"since": 10,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "InvoiceChange",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createInvoice(values?: $Shape<$Exact<Invoice>>): Invoice {
	return Object.assign(create(_TypeModel, InvoiceTypeRef), values)
}
