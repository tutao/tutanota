// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", "PaymentErrorInfo")
export const _TypeModel: TypeModel = {
	"name": "PaymentErrorInfo",
	"since": 52,
	"type": "AGGREGATED_TYPE",
	"id": 1603,
	"rootId": "A3N5cwAGQw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1604, "since": 52, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"errorCode": {
			"name": "errorCode",
			"id": 1606,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"errorTime": {
			"name": "errorTime",
			"id": 1605,
			"since": 52,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"thirdPartyErrorId": {
			"name": "thirdPartyErrorId",
			"id": 1607,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "52"
}

export function createPaymentErrorInfo(values?: $Shape<$Exact<PaymentErrorInfo>>): PaymentErrorInfo {
	return Object.assign(create(_TypeModel, PaymentErrorInfoTypeRef), values)
}
