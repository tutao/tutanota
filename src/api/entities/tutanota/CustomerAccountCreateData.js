// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
		"_format": {"name": "_format", "id": 649, "since": 16, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"adminEncAccountingInfoSessionKey": {
			"name": "adminEncAccountingInfoSessionKey",
			"id": 659,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminEncCustomerServerPropertiesSessionKey": {
			"name": "adminEncCustomerServerPropertiesSessionKey",
			"id": 661,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 650,
			"since": 16,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {"name": "code", "id": 873, "since": 24, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"date": {"name": "date", "id": 651, "since": 16, "type": "Date", "cardinality": "ZeroOrOne", "final": false, "encrypted": false},
		"lang": {"name": "lang", "id": 652, "since": 16, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"systemAdminPubEncAccountingInfoSessionKey": {
			"name": "systemAdminPubEncAccountingInfoSessionKey",
			"id": 660,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncAccountGroupKey": {
			"name": "userEncAccountGroupKey",
			"id": 655,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncAdminGroupKey": {
			"name": "userEncAdminGroupKey",
			"id": 654,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroupData": {
			"name": "adminGroupData",
			"id": 657,
			"since": 16,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		},
		"customerGroupData": {
			"name": "customerGroupData",
			"id": 658,
			"since": 16,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		},
		"userData": {
			"name": "userData",
			"id": 653,
			"since": 16,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "UserAccountUserData",
			"final": false
		},
		"userGroupData": {
			"name": "userGroupData",
			"id": 656,
			"since": 16,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCustomerAccountCreateData(values?: $Shape<$Exact<CustomerAccountCreateData>>): CustomerAccountCreateData {
	return Object.assign(create(_TypeModel, CustomerAccountCreateDataTypeRef), values)
}
