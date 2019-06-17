// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", "UserAlarmInfo")
export const _TypeModel: TypeModel = {
	"name": "UserAlarmInfo",
	"since": 47,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1529,
	"rootId": "A3N5cwAF-Q",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 1533, "since": 47, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1531, "since": 47, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1535,
			"since": 47,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 1534, "since": 47, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 1532, "since": 47, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1536,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "AlarmInfo",
			"final": false
		}
	},
	"app": "sys",
	"version": "47"
}

export function createUserAlarmInfo(): UserAlarmInfo {
	return create(_TypeModel, UserAlarmInfoTypeRef)
}
