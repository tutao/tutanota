// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", "DebitServicePutData")
export const _TypeModel: TypeModel = {
	"name": "DebitServicePutData",
	"since": 18,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1041,
	"rootId": "A3N5cwAEEQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1042,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoice": {
			"name": "invoice",
			"id": 1043,
			"since": 18,
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

export function createDebitServicePutData(values?: $Shape<$Exact<DebitServicePutData>>): DebitServicePutData {
	return Object.assign(create(_TypeModel, DebitServicePutDataTypeRef), values)
}

export type DebitServicePutData = {
	_type: TypeRef<DebitServicePutData>;

	_format: NumberString;

	invoice: ?IdTuple;
}