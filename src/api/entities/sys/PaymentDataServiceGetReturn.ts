import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "74"
}

export function createPaymentDataServiceGetReturn(values?: Partial<PaymentDataServiceGetReturn>): PaymentDataServiceGetReturn {
	return Object.assign(create(_TypeModel, PaymentDataServiceGetReturnTypeRef), downcast<PaymentDataServiceGetReturn>(values))
}

export type PaymentDataServiceGetReturn = {
	_type: TypeRef<PaymentDataServiceGetReturn>;

	_format: NumberString;
	loginUrl: string;
}