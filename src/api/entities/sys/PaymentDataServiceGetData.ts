import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PaymentDataServiceGetDataTypeRef: TypeRef<PaymentDataServiceGetData> = new TypeRef("sys", "PaymentDataServiceGetData")
export const _TypeModel: TypeModel = {
	"name": "PaymentDataServiceGetData",
	"since": 67,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1861,
	"rootId": "A3N5cwAHRQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1862,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"clientType": {
			"id": 1863,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createPaymentDataServiceGetData(values?: Partial<PaymentDataServiceGetData>): PaymentDataServiceGetData {
	return Object.assign(create(_TypeModel, PaymentDataServiceGetDataTypeRef), downcast<PaymentDataServiceGetData>(values))
}

export type PaymentDataServiceGetData = {
	_type: TypeRef<PaymentDataServiceGetData>;

	_format: NumberString;
	clientType: null | NumberString;
}