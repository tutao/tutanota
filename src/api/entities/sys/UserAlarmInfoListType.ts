import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "UserAlarmInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserAlarmInfoListType(values?: Partial<UserAlarmInfoListType>): UserAlarmInfoListType {
	return Object.assign(create(_TypeModel, UserAlarmInfoListTypeTypeRef), downcast<UserAlarmInfoListType>(values))
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;

	_id: Id;

	alarms: Id;
}