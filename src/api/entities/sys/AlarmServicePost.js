// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1577,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"alarmNotifications": {
			"name": "alarmNotifications",
			"id": 1578,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AlarmNotification",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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