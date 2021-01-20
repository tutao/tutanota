// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1838,
			"since": 66,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"braintree3dsResponse": {
			"name": "braintree3dsResponse",
			"id": 1839,
			"since": 66,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "Braintree3ds2Response",
			"final": false
		}
	},
	"app": "sys",
	"version": "66"
}

export function createPaymentDataServicePostData(values?: $Shape<$Exact<PaymentDataServicePostData>>): PaymentDataServicePostData {
	return Object.assign(create(_TypeModel, PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostData = {
	_type: TypeRef<PaymentDataServicePostData>;

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}