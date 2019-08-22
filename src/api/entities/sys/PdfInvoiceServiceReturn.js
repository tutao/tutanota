// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PdfInvoiceServiceReturnTypeRef: TypeRef<PdfInvoiceServiceReturn> = new TypeRef("sys", "PdfInvoiceServiceReturn")
export const _TypeModel: TypeModel = {
	"name": "PdfInvoiceServiceReturn",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 780,
	"rootId": "A3N5cwADDA",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 781,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}, "data": {"name": "data", "id": 782, "since": 9, "type": "Bytes", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "sys",
	"version": "49"
}

export function createPdfInvoiceServiceReturn(values?: $Shape<$Exact<PdfInvoiceServiceReturn>>): PdfInvoiceServiceReturn {
	return Object.assign(create(_TypeModel, PdfInvoiceServiceReturnTypeRef), values)
}
