// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const UserDataTypeRef: TypeRef<UserData> = new TypeRef("sys", "UserData")
export const _TypeModel: TypeModel = {
	"name": "UserData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 396,
	"rootId": "A3N5cwABjA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 397,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 878,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"mobilePhoneNumber": {
			"name": "mobilePhoneNumber",
			"id": 403,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 401,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 398,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncCustomerGroupKey": {
			"name": "userEncCustomerGroupKey",
			"id": 399,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 402,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userGroupData": {
			"name": "userGroupData",
			"id": 400,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "CreateGroupData",
			"final": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createUserData(): UserData {
	return create(_TypeModel)
}
