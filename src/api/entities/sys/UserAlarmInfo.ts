import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {AlarmInfo} from "./AlarmInfo.js"

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
			"id": 1545,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1543,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1547,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1546,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1544,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmInfo": {
			"id": 1548,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "AlarmInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "71"
}

export function createUserAlarmInfo(values?: Partial<UserAlarmInfo>): UserAlarmInfo {
	return Object.assign(create(_TypeModel, UserAlarmInfoTypeRef), downcast<UserAlarmInfo>(values))
}

export type UserAlarmInfo = {
	_type: TypeRef<UserAlarmInfo>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	alarmInfo: AlarmInfo;
}