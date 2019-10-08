// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarGroupDataTypeRef: TypeRef<CalendarGroupData> = new TypeRef("tutanota", "CalendarGroupData")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupData",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 956,
	"rootId": "CHR1dGFub3RhAAO8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 957, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"adminEncGroupKey": {
			"name": "adminEncGroupKey",
			"id": 959,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"calendarEncCalendarGroupRootSessionKey": {
			"name": "calendarEncCalendarGroupRootSessionKey",
			"id": 958,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupInfoEncName": {
			"name": "groupInfoEncName",
			"id": 962,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncGroupInfoSessionKey": {
			"name": "ownerEncGroupInfoSessionKey",
			"id": 960,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncGroupKey": {
			"name": "userEncGroupKey",
			"id": 961,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroup": {
			"name": "adminGroup",
			"id": 963,
			"since": 33,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCalendarGroupData(values?: $Shape<$Exact<CalendarGroupData>>): CalendarGroupData {
	return Object.assign(create(_TypeModel, CalendarGroupDataTypeRef), values)
}
