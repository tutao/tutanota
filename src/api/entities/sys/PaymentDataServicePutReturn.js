// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 806,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"result": {
			"name": "result",
			"id": 807,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createPaymentDataServicePutReturn(): PaymentDataServicePutReturn {
	return create(_TypeModel)
}
