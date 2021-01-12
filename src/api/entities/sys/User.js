// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"refType": "UserAlarmInfoListType"
		},
		"auth": {
			"id": 1210,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAuthentication"
		},
		"authenticatedDevices": {
			"id": 97,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "AuthenticatedDevice"
		},
		"externalAuthInfo": {
			"id": 98,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserExternalAuthInfo"
		},
		"memberships": {
			"id": 96,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "GroupMembership"
		},
		"phoneNumbers": {
			"id": 94,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "PhoneNumber"
		},
		"pushIdentifierList": {
			"id": 638,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PushIdentifierList"
		},
		"userGroup": {
			"id": 95,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupMembership"
		},
		"customer": {
			"id": 99,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Customer"
		},
		"failedLogins": {
			"id": 101,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Login"
		},
		"secondFactorAuthentications": {
			"id": 102,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SecondFactorAuthentication"
		},
		"successfulLogins": {
			"id": 100,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Login"
		}
	},
	"app": "sys",
	"version": "68"
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