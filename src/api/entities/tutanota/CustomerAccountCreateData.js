// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {InternalGroupData} from "./InternalGroupData"
import type {UserAccountUserData} from "./UserAccountUserData"

export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", "CustomerAccountCreateData")
export const _TypeModel: TypeModel = {
	"name": "CustomerAccountCreateData",
	"since": 16,
	"type": "DATA_TRANSFER_TYPE",
	"id": 648,
	"rootId": "CHR1dGFub3RhAAKI",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 649,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminEncAccountingInfoSessionKey": {
			"id": 659,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminEncCustomerServerPropertiesSessionKey": {
			"id": 661,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 650,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"id": 873,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 651,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"lang": {
			"id": 652,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemAdminPubEncAccountingInfoSessionKey": {
			"id": 660,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncAccountGroupKey": {
			"id": 655,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncAdminGroupKey": {
			"id": 654,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroupData": {
			"id": 657,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData"
		},
		"customerGroupData": {
			"id": 658,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData"
		},
		"userData": {
			"id": 653,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "UserAccountUserData"
		},
		"userGroupData": {
			"id": 656,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createCustomerAccountCreateData(values?: $Shape<$Exact<CustomerAccountCreateData>>): CustomerAccountCreateData {
	return Object.assign(create(_TypeModel, CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;

	_format: NumberString;
	adminEncAccountingInfoSessionKey: Uint8Array;
	adminEncCustomerServerPropertiesSessionKey: Uint8Array;
	authToken: string;
	code: string;
	date: ?Date;
	lang: string;
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array;
	userEncAccountGroupKey: Uint8Array;
	userEncAdminGroupKey: Uint8Array;

	adminGroupData: InternalGroupData;
	customerGroupData: InternalGroupData;
	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}