// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {OutOfOfficeNotificationMessage} from "./OutOfOfficeNotificationMessage"

export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", "OutOfOfficeNotification")
export const _TypeModel: TypeModel = {
	"name": "OutOfOfficeNotification",
	"since": 44,
	"type": "ELEMENT_TYPE",
	"id": 1131,
	"rootId": "CHR1dGFub3RhAARr",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1135,
			"since": 44,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1133,
			"since": 44,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1136,
			"since": 44,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1134,
			"since": 44,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"name": "enabled",
			"id": 1137,
			"since": 44,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"endDate": {
			"name": "endDate",
			"id": 1139,
			"since": 44,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"startDate": {
			"name": "startDate",
			"id": 1138,
			"since": 44,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"notifications": {
			"name": "notifications",
			"id": 1140,
			"since": 44,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "OutOfOfficeNotificationMessage",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createOutOfOfficeNotification(values?: $Shape<$Exact<OutOfOfficeNotification>>): OutOfOfficeNotification {
	return Object.assign(create(_TypeModel, OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotification = {
	_type: TypeRef<OutOfOfficeNotification>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	enabled: boolean;
	endDate: ?Date;
	startDate: ?Date;

	notifications: OutOfOfficeNotificationMessage[];
}