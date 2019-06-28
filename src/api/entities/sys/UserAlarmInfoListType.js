// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", "UserAlarmInfoListType")
export const _TypeModel: TypeModel = {
	"name": "UserAlarmInfoListType",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1542,
	"rootId": "A3N5cwAGBg",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 1543, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"alarms": {
			"name": "alarms",
			"id": 1544,
			"since": 47,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "UserAlarmInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "47"
}

export function createUserAlarmInfoListType(): UserAlarmInfoListType {
	return create(_TypeModel, UserAlarmInfoListTypeTypeRef)
}
