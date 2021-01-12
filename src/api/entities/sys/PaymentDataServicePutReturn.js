// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {Braintree3ds2Request} from "./Braintree3ds2Request"

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
			"refType": "Braintree3ds2Request"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createPaymentDataServicePutReturn(values?: $Shape<$Exact<PaymentDataServicePutReturn>>): PaymentDataServicePutReturn {
	return Object.assign(create(_TypeModel, PaymentDataServicePutReturnTypeRef), values)
}

export type PaymentDataServicePutReturn = {
	_type: TypeRef<PaymentDataServicePutReturn>;

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest: ?Braintree3ds2Request;
}