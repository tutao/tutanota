import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 781,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1630,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerPublicEncSessionKey": {
			"id": 1631,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"data": {
			"id": 782,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createPdfInvoiceServiceReturn(values?: Partial<PdfInvoiceServiceReturn>): PdfInvoiceServiceReturn {
	return Object.assign(create(_TypeModel, PdfInvoiceServiceReturnTypeRef), downcast<PdfInvoiceServiceReturn>(values))
}

export type PdfInvoiceServiceReturn = {
	_type: TypeRef<PdfInvoiceServiceReturn>;
	_errors: Object;

	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerPublicEncSessionKey: null | Uint8Array;
	data: Uint8Array;
}