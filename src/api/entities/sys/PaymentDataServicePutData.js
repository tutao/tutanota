// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {CreditCard} from "./CreditCard"

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
			"name": "_format",
			"id": 794,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"business": {
			"name": "business",
			"id": 795,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"confirmedCountry": {
			"name": "confirmedCountry",
			"id": 804,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"invoiceAddress": {
			"name": "invoiceAddress",
			"id": 797,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceCountry": {
			"name": "invoiceCountry",
			"id": 798,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceName": {
			"name": "invoiceName",
			"id": 796,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceVatIdNo": {
			"name": "invoiceVatIdNo",
			"id": 799,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"paymentInterval": {
			"name": "paymentInterval",
			"id": 802,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMethod": {
			"name": "paymentMethod",
			"id": 800,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"paymentMethodInfo": {
			"name": "paymentMethodInfo",
			"id": 801,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentToken": {
			"name": "paymentToken",
			"id": 803,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"creditCard": {
			"name": "creditCard",
			"id": 1320,
			"since": 30,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "CreditCard",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createPaymentDataServicePutData(values?: $Shape<$Exact<PaymentDataServicePutData>>): PaymentDataServicePutData {
	return Object.assign(create(_TypeModel, PaymentDataServicePutDataTypeRef), values)
}

export type PaymentDataServicePutData = {
	_type: TypeRef<PaymentDataServicePutData>;
	_errors: Object;

	_format: NumberString;
	business: boolean;
	confirmedCountry: ?string;
	invoiceAddress: string;
	invoiceCountry: string;
	invoiceName: string;
	invoiceVatIdNo: string;
	paymentInterval: NumberString;
	paymentMethod: NumberString;
	paymentMethodInfo: ?string;
	paymentToken: ?string;

	creditCard: ?CreditCard;
}