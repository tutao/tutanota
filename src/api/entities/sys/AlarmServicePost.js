// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {AlarmNotification} from "./AlarmNotification"

export const AlarmServicePostTypeRef: TypeRef<AlarmServicePost> = new TypeRef("sys", "AlarmServicePost")
export const _TypeModel: TypeModel = {
	"name": "AlarmServicePost",
	"since": 48,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1576,
	"rootId": "A3N5cwAGKA",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1577,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"alarmNotifications": {
			"id": 1578,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "AlarmNotification",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "69"
}

export function createAlarmServicePost(values?: $Shape<$Exact<AlarmServicePost>>): AlarmServicePost {
	return Object.assign(create(_TypeModel, AlarmServicePostTypeRef), values)
}

export type AlarmServicePost = {
	_type: TypeRef<AlarmServicePost>;
	_errors: Object;

	_format: NumberString;

	alarmNotifications: AlarmNotification[];
}