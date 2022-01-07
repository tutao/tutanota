import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {CreateGroupData} from "./CreateGroupData"

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
			"id": 397,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 878,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"mobilePhoneNumber": {
			"id": 403,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 401,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 398,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncCustomerGroupKey": {
			"id": 399,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 402,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userGroupData": {
			"id": 400,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CreateGroupData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "71"
}

export function createUserData(values?: Partial<UserData>): UserData {
	return Object.assign(create(_TypeModel, UserDataTypeRef), downcast<UserData>(values))
}

export type UserData = {
	_type: TypeRef<UserData>;

	_format: NumberString;
	date: null | Date;
	mobilePhoneNumber: string;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
	userEncCustomerGroupKey: Uint8Array;
	verifier: Uint8Array;

	userGroupData:  null | CreateGroupData;
}