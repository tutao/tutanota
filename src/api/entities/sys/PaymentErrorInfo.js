// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", "PaymentErrorInfo")
export const _TypeModel: TypeModel = {
	"name": "PaymentErrorInfo",
	"since": 52,
	"type": "AGGREGATED_TYPE",
	"id": 1632,
	"rootId": "A3N5cwAGYA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1633,
			"since": 52,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"errorCode": {
			"name": "errorCode",
			"id": 1635,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"errorTime": {
			"name": "errorTime",
			"id": 1634,
			"since": 52,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"thirdPartyErrorId": {
			"name": "thirdPartyErrorId",
			"id": 1636,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPaymentErrorInfo(values?: $Shape<$Exact<PaymentErrorInfo>>): PaymentErrorInfo {
	return Object.assign(create(_TypeModel, PaymentErrorInfoTypeRef), values)
}

export type PaymentErrorInfo = {
	_type: TypeRef<PaymentErrorInfo>;

	_id: Id;
	errorCode: string;
	errorTime: Date;
	thirdPartyErrorId: string;
}