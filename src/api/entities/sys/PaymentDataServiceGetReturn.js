// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", "PaymentDataServiceGetReturn")
export const _TypeModel: TypeModel = {
	"name": "PaymentDataServiceGetReturn",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 790,
	"rootId": "A3N5cwADFg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 791,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"loginUrl": {
			"id": 792,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createPaymentDataServiceGetReturn(values?: $Shape<$Exact<PaymentDataServiceGetReturn>>): PaymentDataServiceGetReturn {
	return Object.assign(create(_TypeModel, PaymentDataServiceGetReturnTypeRef), values)
}

export type PaymentDataServiceGetReturn = {
	_type: TypeRef<PaymentDataServiceGetReturn>;

	_format: NumberString;
	loginUrl: string;
}