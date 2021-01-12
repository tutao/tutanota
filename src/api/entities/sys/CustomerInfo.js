// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {BookingsRef} from "./BookingsRef"
import type {DomainInfo} from "./DomainInfo"
import type {GiftCardsRef} from "./GiftCardsRef"

export const CustomerInfoTypeRef: TypeRef<CustomerInfo> = new TypeRef("sys", "CustomerInfo")
export const _TypeModel: TypeModel = {
	"name": "CustomerInfo",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 148,
	"rootId": "A3N5cwAAlA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 152,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 150,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1011,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 151,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"activationTime": {
			"id": 157,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"company": {
			"id": 153,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"creationTime": {
			"id": 155,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deletionReason": {
			"id": 640,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"deletionTime": {
			"id": 639,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"domain": {
			"id": 154,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"erased": {
			"id": 1381,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"includedEmailAliases": {
			"id": 1067,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedStorageCapacity": {
			"id": 1068,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"promotionEmailAliases": {
			"id": 976,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"promotionStorageCapacity": {
			"id": 650,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"registrationMailAddress": {
			"id": 597,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"source": {
			"id": 725,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testEndTime": {
			"id": 156,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"usedSharedEmailAliases": {
			"id": 977,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"bookings": {
			"id": 727,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "BookingsRef"
		},
		"domainInfos": {
			"id": 726,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "DomainInfo"
		},
		"giftCards": {
			"id": 1794,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "GiftCardsRef"
		},
		"accountingInfo": {
			"id": 159,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "AccountingInfo"
		},
		"customer": {
			"id": 158,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer"
		},
		"takeoverCustomer": {
			"id": 1076,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Customer"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createCustomerInfo(values?: $Shape<$Exact<CustomerInfo>>): CustomerInfo {
	return Object.assign(create(_TypeModel, CustomerInfoTypeRef), values)
}

export type CustomerInfo = {
	_type: TypeRef<CustomerInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	activationTime: ?Date;
	company: ?string;
	creationTime: Date;
	deletionReason: ?string;
	deletionTime: ?Date;
	domain: string;
	erased: boolean;
	includedEmailAliases: NumberString;
	includedStorageCapacity: NumberString;
	promotionEmailAliases: NumberString;
	promotionStorageCapacity: NumberString;
	registrationMailAddress: string;
	source: string;
	testEndTime: ?Date;
	usedSharedEmailAliases: NumberString;

	bookings: ?BookingsRef;
	domainInfos: DomainInfo[];
	giftCards: ?GiftCardsRef;
	accountingInfo: Id;
	customer: Id;
	takeoverCustomer: ?Id;
}