import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {PaymentErrorInfo} from "./PaymentErrorInfo.js"

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
			"id": 756,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 754,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1008,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 755,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"extendedPeriodOfPaymentDays": {
			"id": 1638,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"persistentPaymentPeriodExtension": {
			"id": 1639,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"publishInvoices": {
			"id": 759,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"reminderState": {
			"id": 1637,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"specialPriceBrandingPerUser": {
			"id": 1282,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceBusinessPerUser": {
			"id": 1864,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceContactFormSingle": {
			"id": 1284,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceSharedGroupSingle": {
			"id": 1283,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceSharingPerUser": {
			"id": 1627,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserSingle": {
			"id": 758,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserTotal": {
			"id": 757,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invoices": {
			"id": 760,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "LegacyInvoice",
			"dependency": null
		},
		"paymentErrorInfo": {
			"id": 1640,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "PaymentErrorInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createInvoiceInfo(values?: Partial<InvoiceInfo>): InvoiceInfo {
	return Object.assign(create(_TypeModel, InvoiceInfoTypeRef), downcast<InvoiceInfo>(values))
}

export type InvoiceInfo = {
	_type: TypeRef<InvoiceInfo>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	extendedPeriodOfPaymentDays: NumberString;
	persistentPaymentPeriodExtension: boolean;
	publishInvoices: boolean;
	reminderState: NumberString;
	specialPriceBrandingPerUser: null | NumberString;
	specialPriceBusinessPerUser: null | NumberString;
	specialPriceContactFormSingle: null | NumberString;
	specialPriceSharedGroupSingle: null | NumberString;
	specialPriceSharingPerUser: null | NumberString;
	specialPriceUserSingle: null | NumberString;
	specialPriceUserTotal: null | NumberString;

	invoices: Id;
	paymentErrorInfo:  null | PaymentErrorInfo;
}