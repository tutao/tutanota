// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {Braintree3ds2Response} from "./Braintree3ds2Response"

export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", "PaymentDataServicePostData")
export const _TypeModel: TypeModel = {
	"name": "PaymentDataServicePostData",
	"since": 66,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1837,
	"rootId": "A3N5cwAHLQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1838,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"braintree3dsResponse": {
			"id": 1839,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "Braintree3ds2Response"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createPaymentDataServicePostData(values?: $Shape<$Exact<PaymentDataServicePostData>>): PaymentDataServicePostData {
	return Object.assign(create(_TypeModel, PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostData = {
	_type: TypeRef<PaymentDataServicePostData>;

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}