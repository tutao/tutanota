import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {CreditCard} from "./CreditCard.js"

export const PaymentDataServicePutDataTypeRef: TypeRef<PaymentDataServicePutData> = new TypeRef("sys", "PaymentDataServicePutData")
export const _TypeModel: TypeModel = {
	"name": "PaymentDataServicePutData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 793,
	"rootId": "A3N5cwADGQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 794,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"business": {
			"id": 795,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"confirmedCountry": {
			"id": 804,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"invoiceAddress": {
			"id": 797,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceCountry": {
			"id": 798,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceName": {
			"id": 796,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceVatIdNo": {
			"id": 799,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"paymentInterval": {
			"id": 802,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMethod": {
			"id": 800,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"paymentMethodInfo": {
			"id": 801,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentToken": {
			"id": 803,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"creditCard": {
			"id": 1320,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CreditCard",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "73"
}

export function createPaymentDataServicePutData(values?: Partial<PaymentDataServicePutData>): PaymentDataServicePutData {
	return Object.assign(create(_TypeModel, PaymentDataServicePutDataTypeRef), downcast<PaymentDataServicePutData>(values))
}

export type PaymentDataServicePutData = {
	_type: TypeRef<PaymentDataServicePutData>;
	_errors: Object;

	_format: NumberString;
	business: boolean;
	confirmedCountry: null | string;
	invoiceAddress: string;
	invoiceCountry: string;
	invoiceName: string;
	invoiceVatIdNo: string;
	paymentInterval: NumberString;
	paymentMethod: NumberString;
	paymentMethodInfo: null | string;
	paymentToken: null | string;

	creditCard:  null | CreditCard;
}