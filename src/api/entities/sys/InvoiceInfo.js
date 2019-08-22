// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", "InvoiceInfo")
export const _TypeModel: TypeModel = {
	"name": "InvoiceInfo",
	"since": 9,
	"type": "ELEMENT_TYPE",
	"id": 752,
	"rootId": "A3N5cwAC8A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 756, "since": 9, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 754, "since": 9, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1008,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 755,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"publishInvoices": {
			"name": "publishInvoices",
			"id": 759,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"specialPriceBrandingPerUser": {
			"name": "specialPriceBrandingPerUser",
			"id": 1282,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceContactFormSingle": {
			"name": "specialPriceContactFormSingle",
			"id": 1284,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceSharedGroupSingle": {
			"name": "specialPriceSharedGroupSingle",
			"id": 1283,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserSingle": {
			"name": "specialPriceUserSingle",
			"id": 758,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserTotal": {
			"name": "specialPriceUserTotal",
			"id": 757,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoices": {
			"name": "invoices",
			"id": 760,
			"since": 9,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Invoice",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createInvoiceInfo(values?: $Shape<$Exact<InvoiceInfo>>): InvoiceInfo {
	return Object.assign(create(_TypeModel, InvoiceInfoTypeRef), values)
}
