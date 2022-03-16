import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Braintree3ds2Request} from "./Braintree3ds2Request.js"

export const PaymentDataServicePutReturnTypeRef: TypeRef<PaymentDataServicePutReturn> = new TypeRef("sys", "PaymentDataServicePutReturn")
export const _TypeModel: TypeModel = {
	"name": "PaymentDataServicePutReturn",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 805,
	"rootId": "A3N5cwADJQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 806,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"result": {
			"id": 807,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"braintree3dsRequest": {
			"id": 1840,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Braintree3ds2Request",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPaymentDataServicePutReturn(values?: Partial<PaymentDataServicePutReturn>): PaymentDataServicePutReturn {
	return Object.assign(create(_TypeModel, PaymentDataServicePutReturnTypeRef), downcast<PaymentDataServicePutReturn>(values))
}

export type PaymentDataServicePutReturn = {
	_type: TypeRef<PaymentDataServicePutReturn>;

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest:  null | Braintree3ds2Request;
}