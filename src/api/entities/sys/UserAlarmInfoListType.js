// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1550,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarms": {
			"id": 1551,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "UserAlarmInfo"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createUserAlarmInfoListType(values?: $Shape<$Exact<UserAlarmInfoListType>>): UserAlarmInfoListType {
	return Object.assign(create(_TypeModel, UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;

	_id: Id;

	alarms: Id;
}