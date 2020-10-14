// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {PaymentErrorInfo} from "./PaymentErrorInfo"

export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", "InvoiceInfo")
export const _TypeModel: TypeModel = {
	"name": "InvoiceInfo",
	"since": 9,
	"type": "ELEMENT_TYPE",
	"id": 752,
	"rootId": "A3N5cwAC8A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 756,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 754,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1008,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 755,
			"since": 9,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"extendedPeriodOfPaymentDays": {
			"name": "extendedPeriodOfPaymentDays",
			"id": 1638,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"persistentPaymentPeriodExtension": {
			"name": "persistentPaymentPeriodExtension",
			"id": 1639,
			"since": 52,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"publishInvoices": {
			"name": "publishInvoices",
			"id": 759,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"reminderState": {
			"name": "reminderState",
			"id": 1637,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"specialPriceBrandingPerUser": {
			"name": "specialPriceBrandingPerUser",
			"id": 1282,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceContactFormSingle": {
			"name": "specialPriceContactFormSingle",
			"id": 1284,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceSharedGroupSingle": {
			"name": "specialPriceSharedGroupSingle",
			"id": 1283,
			"since": 26,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceSharingPerUser": {
			"name": "specialPriceSharingPerUser",
			"id": 1627,
			"since": 52,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserSingle": {
			"name": "specialPriceUserSingle",
			"id": 758,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserTotal": {
			"name": "specialPriceUserTotal",
			"id": 757,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"paymentErrorInfo": {
			"name": "paymentErrorInfo",
			"id": 1640,
			"since": 52,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PaymentErrorInfo",
			"final": true
		},
		"invoices": {
			"name": "invoices",
			"id": 760,
			"since": 9,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "LegacyInvoice",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createInvoiceInfo(values?: $Shape<$Exact<InvoiceInfo>>): InvoiceInfo {
	return Object.assign(create(_TypeModel, InvoiceInfoTypeRef), values)
}

export type InvoiceInfo = {
	_type: TypeRef<InvoiceInfo>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	extendedPeriodOfPaymentDays: NumberString;
	persistentPaymentPeriodExtension: boolean;
	publishInvoices: boolean;
	reminderState: NumberString;
	specialPriceBrandingPerUser: ?NumberString;
	specialPriceContactFormSingle: ?NumberString;
	specialPriceSharedGroupSingle: ?NumberString;
	specialPriceSharingPerUser: ?NumberString;
	specialPriceUserSingle: ?NumberString;
	specialPriceUserTotal: ?NumberString;

	paymentErrorInfo: ?PaymentErrorInfo;
	invoices: Id;
}