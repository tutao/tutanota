// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarGroupDataTypeRef: TypeRef<CalendarGroupData> = new TypeRef("tutanota", "CalendarGroupData")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupData",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 960,
	"rootId": "CHR1dGFub3RhAAPA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 961, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"adminEncGroupKey": {"name": "adminEncGroupKey", "id": 963, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"calendarEncCalendarGroupRootSessionKey": {
			"name": "calendarEncCalendarGroupRootSessionKey",
			"id": 962,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encColor": {"name": "encColor", "id": 967, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"encName": {"name": "encName", "id": 966, "since": 33, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"ownerEncGroupInfoSessionKey": {
			"name": "ownerEncGroupInfoSessionKey",
			"id": 964,
			"since": 33,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncGroupKey": {"name": "userEncGroupKey", "id": 965, "since": 33, "type": "Bytes", "cardinality": "ZeroOrOne", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "33"
}

export function createCalendarGroupData(): CalendarGroupData {
	return create(_TypeModel, CalendarGroupDataTypeRef)
}
