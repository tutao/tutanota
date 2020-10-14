// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", "UserAlarmInfoListType")
export const _TypeModel: TypeModel = {
	"name": "UserAlarmInfoListType",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1549,
	"rootId": "A3N5cwAGDQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1550,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarms": {
			"name": "alarms",
			"id": 1551,
			"since": 48,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "UserAlarmInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUserAlarmInfoListType(values?: $Shape<$Exact<UserAlarmInfoListType>>): UserAlarmInfoListType {
	return Object.assign(create(_TypeModel, UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;

	_id: Id;

	alarms: Id;
}