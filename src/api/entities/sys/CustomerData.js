// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 375,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountingInfoBucketEncAccountingInfoSessionKey": {
			"id": 385,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminEncAccountingInfoSessionKey": {
			"id": 383,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 376,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"company": {
			"id": 377,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 877,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"id": 378,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 388,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncAccountGroupKey": {
			"id": 390,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemCustomerPubEncAccountingInfoBucketKey": {
			"id": 386,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemCustomerPubKeyVersion": {
			"id": 387,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 384,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 389,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroupList": {
			"id": 379,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CreateGroupListData"
		},
		"customerGroupList": {
			"id": 381,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CreateGroupListData"
		},
		"teamGroupList": {
			"id": 382,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CreateGroupListData"
		},
		"userGroupList": {
			"id": 380,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CreateGroupListData"
		}
	},
	"app": "sys",
	"version": "68"
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