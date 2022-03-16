import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UserAlarmInfoListType} from "./UserAlarmInfoListType.js"
import type {UserAuthentication} from "./UserAuthentication.js"
import type {AuthenticatedDevice} from "./AuthenticatedDevice.js"
import type {UserExternalAuthInfo} from "./UserExternalAuthInfo.js"
import type {GroupMembership} from "./GroupMembership.js"
import type {PhoneNumber} from "./PhoneNumber.js"
import type {PushIdentifierList} from "./PushIdentifierList.js"

export const UserTypeRef: TypeRef<User> = new TypeRef("sys", "User")
export const _TypeModel: TypeModel = {
	"name": "User",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 84,
	"rootId": "A3N5cwBU",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 88,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 86,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 996,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 87,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accountType": {
			"id": 92,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"id": 93,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"requirePasswordUpdate": {
			"id": 1117,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"id": 90,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 89,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"verifier": {
			"id": 91,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmInfoList": {
			"id": 1552,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "UserAlarmInfoListType",
			"dependency": null
		},
		"auth": {
			"id": 1210,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAuthentication",
			"dependency": null
		},
		"authenticatedDevices": {
			"id": 97,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "AuthenticatedDevice",
			"dependency": null
		},
		"customer": {
			"id": 99,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Customer",
			"dependency": null
		},
		"externalAuthInfo": {
			"id": 98,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserExternalAuthInfo",
			"dependency": null
		},
		"failedLogins": {
			"id": 101,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Login",
			"dependency": null
		},
		"memberships": {
			"id": 96,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "GroupMembership",
			"dependency": null
		},
		"phoneNumbers": {
			"id": 94,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "PhoneNumber",
			"dependency": null
		},
		"pushIdentifierList": {
			"id": 638,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PushIdentifierList",
			"dependency": null
		},
		"secondFactorAuthentications": {
			"id": 102,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SecondFactorAuthentication",
			"dependency": null
		},
		"successfulLogins": {
			"id": 100,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Login",
			"dependency": null
		},
		"userGroup": {
			"id": 95,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupMembership",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUser(values?: Partial<User>): User {
	return Object.assign(create(_TypeModel, UserTypeRef), downcast<User>(values))
}

export type User = {
	_type: TypeRef<User>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	accountType: NumberString;
	enabled: boolean;
	requirePasswordUpdate: boolean;
	salt: null | Uint8Array;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	alarmInfoList:  null | UserAlarmInfoListType;
	auth:  null | UserAuthentication;
	authenticatedDevices: AuthenticatedDevice[];
	customer:  null | Id;
	externalAuthInfo:  null | UserExternalAuthInfo;
	failedLogins: Id;
	memberships: GroupMembership[];
	phoneNumbers: PhoneNumber[];
	pushIdentifierList:  null | PushIdentifierList;
	secondFactorAuthentications: Id;
	successfulLogins: Id;
	userGroup: GroupMembership;
}