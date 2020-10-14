// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {BookingsRef} from "./BookingsRef"
import type {DomainInfo} from "./DomainInfo"

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
			"name": "_format",
			"id": 152,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 150,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1011,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 151,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"activationTime": {
			"name": "activationTime",
			"id": 157,
			"since": 1,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"company": {
			"name": "company",
			"id": 153,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"creationTime": {
			"name": "creationTime",
			"id": 155,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deletionReason": {
			"name": "deletionReason",
			"id": 640,
			"since": 5,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"deletionTime": {
			"name": "deletionTime",
			"id": 639,
			"since": 5,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 154,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"erased": {
			"name": "erased",
			"id": 1381,
			"since": 32,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"includedEmailAliases": {
			"name": "includedEmailAliases",
			"id": 1067,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedStorageCapacity": {
			"name": "includedStorageCapacity",
			"id": 1068,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"promotionEmailAliases": {
			"name": "promotionEmailAliases",
			"id": 976,
			"since": 16,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"promotionStorageCapacity": {
			"name": "promotionStorageCapacity",
			"id": 650,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"registrationMailAddress": {
			"name": "registrationMailAddress",
			"id": 597,
			"since": 2,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"source": {
			"name": "source",
			"id": 725,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testEndTime": {
			"name": "testEndTime",
			"id": 156,
			"since": 1,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"usedSharedEmailAliases": {
			"name": "usedSharedEmailAliases",
			"id": 977,
			"since": 16,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"bookings": {
			"name": "bookings",
			"id": 727,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "BookingsRef",
			"final": true
		},
		"domainInfos": {
			"name": "domainInfos",
			"id": 726,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DomainInfo",
			"final": true
		},
		"accountingInfo": {
			"name": "accountingInfo",
			"id": 159,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "AccountingInfo",
			"final": true,
			"external": false
		},
		"customer": {
			"name": "customer",
			"id": 158,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"takeoverCustomer": {
			"name": "takeoverCustomer",
			"id": 1076,
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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
	accountingInfo: Id;
	customer: Id;
	takeoverCustomer: ?Id;
}