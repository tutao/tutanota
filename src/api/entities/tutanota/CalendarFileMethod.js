// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarFileMethodTypeRef: TypeRef<CalendarFileMethod> = new TypeRef("tutanota", "CalendarFileMethod")
export const _TypeModel: TypeModel = {
	"name": "CalendarFileMethod",
	"since": 37,
	"type": "AGGREGATED_TYPE",
	"id": 1017,
	"rootId": "CHR1dGFub3RhAAP5",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1018, "since": 37, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"method": {"name": "method", "id": 1019, "since": 37, "type": "Number", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 1020,
			"since": 37,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarFileMethod(values?: $Shape<$Exact<CalendarFileMethod>>): CalendarFileMethod {
	return Object.assign(create(_TypeModel, CalendarFileMethodTypeRef), values)
}
