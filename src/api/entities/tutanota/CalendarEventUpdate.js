// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", "CalendarEventUpdate")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUpdate",
	"since": 37,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1010,
	"rootId": "CHR1dGFub3RhAAPy",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1014,
			"since": 37,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 1012, "since": 37, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1015,
			"since": 37,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1013,
			"since": 37,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 1016,
			"since": 37,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarEventUpdate(values?: $Shape<$Exact<CalendarEventUpdate>>): CalendarEventUpdate {
	return Object.assign(create(_TypeModel, CalendarEventUpdateTypeRef), values)
}
