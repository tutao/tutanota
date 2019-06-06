// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarGroupDataTypeRef: TypeRef<CalendarGroupData> = new TypeRef("tutanota", "CalendarGroupData")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupData",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 966,
	"rootId": "CHR1dGFub3RhAAPG",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 967, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"adminEncGroupKey": {"name": "adminEncGroupKey", "id": 969, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"calendarEncCalendarGroupRootSessionKey": {
			"name": "calendarEncCalendarGroupRootSessionKey",
			"id": 968,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encColor": {"name": "encColor", "id": 973, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"encName": {"name": "encName", "id": 972, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"ownerEncGroupInfoSessionKey": {
			"name": "ownerEncGroupInfoSessionKey",
			"id": 970,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncGroupKey": {"name": "userEncGroupKey", "id": 971, "since": 33, "type": "Bytes", "cardinality": "ZeroOrOne", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "33"
}

export function createCalendarGroupData(): CalendarGroupData {
	return create(_TypeModel, CalendarGroupDataTypeRef)
}
