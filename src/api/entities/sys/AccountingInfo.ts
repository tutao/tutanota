import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 147,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 145,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_modified": {
			"id": 1499,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1010,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1009,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 146,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"business": {
			"id": 761,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"invoiceAddress": {
			"id": 763,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceCountry": {
			"id": 764,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"invoiceName": {
			"id": 762,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"invoiceVatIdNo": {
			"id": 766,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastInvoiceNbrOfSentSms": {
			"id": 593,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastInvoiceTimestamp": {
			"id": 592,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"paymentAccountIdentifier": {
			"id": 1060,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentInterval": {
			"id": 769,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paymentMethod": {
			"id": 767,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentMethodInfo": {
			"id": 768,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paymentProviderCustomerId": {
			"id": 770,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"paypalBillingAgreement": {
			"id": 1312,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"secondCountryInfo": {
			"id": 765,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"invoiceInfo": {
			"id": 771,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "InvoiceInfo"
		}
	},
	"app": "sys",
	"version": "73"
}

export function createAccountingInfo(values?: Partial<AccountingInfo>): AccountingInfo {
	return Object.assign(create(_TypeModel, AccountingInfoTypeRef), downcast<AccountingInfo>(values))
}

export type AccountingInfo = {
	_type: TypeRef<AccountingInfo>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_modified: Date;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	business: boolean;
	invoiceAddress: string;
	invoiceCountry: null | string;
	invoiceName: string;
	invoiceVatIdNo: string;
	lastInvoiceNbrOfSentSms: NumberString;
	lastInvoiceTimestamp: null | Date;
	paymentAccountIdentifier: null | string;
	paymentInterval: NumberString;
	paymentMethod: null | NumberString;
	paymentMethodInfo: null | string;
	paymentProviderCustomerId: null | string;
	paypalBillingAgreement: null | string;
	secondCountryInfo: NumberString;

	invoiceInfo:  null | Id;
}