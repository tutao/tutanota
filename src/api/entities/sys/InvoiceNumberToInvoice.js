// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const InvoiceNumberToInvoiceTypeRef: TypeRef<InvoiceNumberToInvoice> = new TypeRef("sys", "InvoiceNumberToInvoice")
export const _TypeModel: TypeModel = {
	"name": "InvoiceNumberToInvoice",
	"since": 32,
	"type": "ELEMENT_TYPE",
	"id": 1356,
	"rootId": "A3N5cwAFTA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1360,
			"since": 32,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1358,
			"since": 32,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1361,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1359,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 1363,
			"since": 32,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"invoice": {
			"name": "invoice",
			"id": 1362,
			"since": 32,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Invoice",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createInvoiceNumberToInvoice(): InvoiceNumberToInvoice {
	return create(_TypeModel)
}
