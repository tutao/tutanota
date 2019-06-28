// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", "UserAlarmInfo")
export const _TypeModel: TypeModel = {
	"name": "UserAlarmInfo",
	"since": 47,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1534,
	"rootId": "A3N5cwAF_g",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 1538, "since": 47, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1536, "since": 47, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1540,
			"since": 47,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 1539, "since": 47, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 1537, "since": 47, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1541,
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
