// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 1042,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoice": {
			"id": 1043,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "LegacyInvoice"
		}
	},
	"app": "sys",
	"version": "71"
}

export function createDebitServicePutData(values?: $Shape<$Exact<DebitServicePutData>>): DebitServicePutData {
	return Object.assign(create(_TypeModel, DebitServicePutDataTypeRef), values)
}

export type DebitServicePutData = {
	_type: TypeRef<DebitServicePutData>;

	_format: NumberString;

	invoice: ?IdTuple;
}