// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {CreateGroupListData} from "./CreateGroupListData"

export const CustomerDataTypeRef: TypeRef<CustomerData> = new TypeRef("sys", "CustomerData")
export const _TypeModel: TypeModel = {
	"name": "CustomerData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 374,
	"rootId": "A3N5cwABdg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 375,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountingInfoBucketEncAccountingInfoSessionKey": {
			"name": "accountingInfoBucketEncAccountingInfoSessionKey",
			"id": 385,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminEncAccountingInfoSessionKey": {
			"name": "adminEncAccountingInfoSessionKey",
			"id": 383,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 376,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"company": {
			"name": "company",
			"id": 377,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 877,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 378,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 388,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncAccountGroupKey": {
			"name": "symEncAccountGroupKey",
			"id": 390,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemCustomerPubEncAccountingInfoBucketKey": {
			"name": "systemCustomerPubEncAccountingInfoBucketKey",
			"id": 386,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemCustomerPubKeyVersion": {
			"name": "systemCustomerPubKeyVersion",
			"id": 387,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 384,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 389,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroupList": {
			"name": "adminGroupList",
			"id": 379,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CreateGroupListData",
			"final": false
		},
		"customerGroupList": {
			"name": "customerGroupList",
			"id": 381,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CreateGroupListData",
			"final": false
		},
		"teamGroupList": {
			"name": "teamGroupList",
			"id": 382,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CreateGroupListData",
			"final": false
		},
		"userGroupList": {
			"name": "userGroupList",
			"id": 380,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CreateGroupListData",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomerData(values?: $Shape<$Exact<CustomerData>>): CustomerData {
	return Object.assign(create(_TypeModel, CustomerDataTypeRef), values)
}

export type CustomerData = {
	_type: TypeRef<CustomerData>;

	_format: NumberString;
	accountingInfoBucketEncAccountingInfoSessionKey: Uint8Array;
	adminEncAccountingInfoSessionKey: Uint8Array;
	authToken: string;
	company: string;
	date: ?Date;
	domain: string;
	salt: Uint8Array;
	symEncAccountGroupKey: Uint8Array;
	systemCustomerPubEncAccountingInfoBucketKey: Uint8Array;
	systemCustomerPubKeyVersion: NumberString;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	adminGroupList: CreateGroupListData;
	customerGroupList: CreateGroupListData;
	teamGroupList: CreateGroupListData;
	userGroupList: CreateGroupListData;
}