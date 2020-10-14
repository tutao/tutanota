// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const AccountingInfoTypeRef: TypeRef<AccountingInfo> = new TypeRef("sys", "AccountingInfo")
export const _TypeModel: TypeModel = {
	"name": "AccountingInfo",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 143,
	"rootId": "A3N5cwAAjw",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 147,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 145,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_modified": {
			"name": "_modified",
			"id": 1499,
			"since": 43,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1010,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1009,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 146,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"business": {
			"name": "business",
			"id": 761,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"invoiceAddress": {
			"name": "invoiceAddress",
			"id": 763,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceCountry": {
			"name": "invoiceCountry",
			"id": 764,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"invoiceName": {
			"name": "invoiceName",
			"id": 762,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceVatIdNo": {
			"name": "invoiceVatIdNo",
			"id": 766,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastInvoiceNbrOfSentSms": {
			"name": "lastInvoiceNbrOfSentSms",
			"id": 593,
			"since": 2,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastInvoiceTimestamp": {
			"name": "lastInvoiceTimestamp",
			"id": 592,
			"since": 2,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"paymentAccountIdentifier": {
			"name": "paymentAccountIdentifier",
			"id": 1060,
			"since": 18,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentInterval": {
			"name": "paymentInterval",
			"id": 769,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMethod": {
			"name": "paymentMethod",
			"id": 767,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentMethodInfo": {
			"name": "paymentMethodInfo",
			"id": 768,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentProviderCustomerId": {
			"name": "paymentProviderCustomerId",
			"id": 770,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paypalBillingAgreement": {
			"name": "paypalBillingAgreement",
			"id": 1312,
			"since": 30,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"secondCountryInfo": {
			"name": "secondCountryInfo",
			"id": 765,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"invoiceInfo": {
			"name": "invoiceInfo",
			"id": 771,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "InvoiceInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAccountingInfo(values?: $Shape<$Exact<AccountingInfo>>): AccountingInfo {
	return Object.assign(create(_TypeModel, AccountingInfoTypeRef), values)
}

export type AccountingInfo = {
	_type: TypeRef<AccountingInfo>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_modified: Date;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	business: boolean;
	invoiceAddress: string;
	invoiceCountry: ?string;
	invoiceName: string;
	invoiceVatIdNo: string;
	lastInvoiceNbrOfSentSms: NumberString;
	lastInvoiceTimestamp: ?Date;
	paymentAccountIdentifier: ?string;
	paymentInterval: NumberString;
	paymentMethod: ?NumberString;
	paymentMethodInfo: ?string;
	paymentProviderCustomerId: ?string;
	paypalBillingAgreement: ?string;
	secondCountryInfo: NumberString;

	invoiceInfo: ?Id;
}