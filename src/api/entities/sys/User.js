// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {UserAlarmInfoListType} from "./UserAlarmInfoListType"
import type {UserAuthentication} from "./UserAuthentication"
import type {AuthenticatedDevice} from "./AuthenticatedDevice"
import type {UserExternalAuthInfo} from "./UserExternalAuthInfo"
import type {GroupMembership} from "./GroupMembership"
import type {PhoneNumber} from "./PhoneNumber"
import type {PushIdentifierList} from "./PushIdentifierList"

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
			"name": "_format",
			"id": 88,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 86,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 996,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 87,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 92,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"name": "enabled",
			"id": 93,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"requirePasswordUpdate": {
			"name": "requirePasswordUpdate",
			"id": 1117,
			"since": 22,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 90,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 89,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 91,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmInfoList": {
			"name": "alarmInfoList",
			"id": 1552,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAlarmInfoListType",
			"final": false
		},
		"auth": {
			"name": "auth",
			"id": 1210,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAuthentication",
			"final": true
		},
		"authenticatedDevices": {
			"name": "authenticatedDevices",
			"id": 97,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AuthenticatedDevice",
			"final": true
		},
		"externalAuthInfo": {
			"name": "externalAuthInfo",
			"id": 98,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserExternalAuthInfo",
			"final": true
		},
		"memberships": {
			"name": "memberships",
			"id": 96,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "GroupMembership",
			"final": true
		},
		"phoneNumbers": {
			"name": "phoneNumbers",
			"id": 94,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "PhoneNumber",
			"final": true
		},
		"pushIdentifierList": {
			"name": "pushIdentifierList",
			"id": 638,
			"since": 5,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PushIdentifierList",
			"final": false
		},
		"userGroup": {
			"name": "userGroup",
			"id": 95,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "GroupMembership",
			"final": true
		},
		"customer": {
			"name": "customer",
			"id": 99,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"failedLogins": {
			"name": "failedLogins",
			"id": 101,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Login",
			"final": true,
			"external": false
		},
		"secondFactorAuthentications": {
			"name": "secondFactorAuthentications",
			"id": 102,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "SecondFactorAuthentication",
			"final": true,
			"external": false
		},
		"successfulLogins": {
			"name": "successfulLogins",
			"id": 100,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Login",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUser(values?: $Shape<$Exact<User>>): User {
	return Object.assign(create(_TypeModel, UserTypeRef), values)
}

export type User = {
	_type: TypeRef<User>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	accountType: NumberString;
	enabled: boolean;
	requirePasswordUpdate: boolean;
	salt: ?Uint8Array;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	alarmInfoList: ?UserAlarmInfoListType;
	auth: ?UserAuthentication;
	authenticatedDevices: AuthenticatedDevice[];
	externalAuthInfo: ?UserExternalAuthInfo;
	memberships: GroupMembership[];
	phoneNumbers: PhoneNumber[];
	pushIdentifierList: ?PushIdentifierList;
	userGroup: GroupMembership;
	customer: ?Id;
	failedLogins: Id;
	secondFactorAuthentications: Id;
	successfulLogins: Id;
}