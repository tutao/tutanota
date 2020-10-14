// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PdfInvoiceServiceDataTypeRef: TypeRef<PdfInvoiceServiceData> = new TypeRef("sys", "PdfInvoiceServiceData")
export const _TypeModel: TypeModel = {
	"name": "PdfInvoiceServiceData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 777,
	"rootId": "A3N5cwADCQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 778,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"invoiceNumber": {
			"name": "invoiceNumber",
			"id": 1629,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoice": {
			"name": "invoice",
			"id": 779,
			"since": 9,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "LegacyInvoice",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createPdfInvoiceServiceData(values?: $Shape<$Exact<PdfInvoiceServiceData>>): PdfInvoiceServiceData {
	return Object.assign(create(_TypeModel, PdfInvoiceServiceDataTypeRef), values)
}

export type PdfInvoiceServiceData = {
	_type: TypeRef<PdfInvoiceServiceData>;

	_format: NumberString;
	invoiceNumber: string;

	invoice: ?IdTuple;
}