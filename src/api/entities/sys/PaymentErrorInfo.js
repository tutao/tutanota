// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1633,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"errorCode": {
			"id": 1635,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"errorTime": {
			"id": 1634,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"thirdPartyErrorId": {
			"id": 1636,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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