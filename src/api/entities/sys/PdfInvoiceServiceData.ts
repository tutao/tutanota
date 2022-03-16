import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 778,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"invoiceNumber": {
			"id": 1629,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoice": {
			"id": 779,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "LegacyInvoice",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPdfInvoiceServiceData(values?: Partial<PdfInvoiceServiceData>): PdfInvoiceServiceData {
	return Object.assign(create(_TypeModel, PdfInvoiceServiceDataTypeRef), downcast<PdfInvoiceServiceData>(values))
}

export type PdfInvoiceServiceData = {
	_type: TypeRef<PdfInvoiceServiceData>;

	_format: NumberString;
	invoiceNumber: string;

	invoice:  null | IdTuple;
}