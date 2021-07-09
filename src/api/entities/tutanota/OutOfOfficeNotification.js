// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1135,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1133,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1136,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1134,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"id": 1137,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"endDate": {
			"id": 1139,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"startDate": {
			"id": 1138,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"notifications": {
			"id": 1140,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "OutOfOfficeNotificationMessage"
		}
	},
	"app": "tutanota",
	"version": "46"
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