// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "68"
}

export function createPdfInvoiceServiceReturn(values?: $Shape<$Exact<PdfInvoiceServiceReturn>>): PdfInvoiceServiceReturn {
	return Object.assign(create(_TypeModel, PdfInvoiceServiceReturnTypeRef), values)
}

export type PdfInvoiceServiceReturn = {
	_type: TypeRef<PdfInvoiceServiceReturn>;
	_errors: Object;

	_format: NumberString;
	_ownerGroup: ?Id;
	_ownerPublicEncSessionKey: ?Uint8Array;
	data: Uint8Array;
}