// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {AlarmInfo} from "./AlarmInfo"

export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", "UserAlarmInfo")
export const _TypeModel: TypeModel = {
	"name": "UserAlarmInfo",
	"since": 48,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1541,
	"rootId": "A3N5cwAGBQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1545,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1543,
			"since": 48,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1547,
			"since": 48,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1546,
			"since": 48,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1544,
			"since": 48,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1548,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "AlarmInfo",
			"final": false
		}
	},
	"app": "sys",
	"version": "65"
}

export function createUserAlarmInfo(values?: $Shape<$Exact<UserAlarmInfo>>): UserAlarmInfo {
	return Object.assign(create(_TypeModel, UserAlarmInfoTypeRef), values)
}

export type UserAlarmInfo = {
	_type: TypeRef<UserAlarmInfo>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;

	alarmInfo: AlarmInfo;
}