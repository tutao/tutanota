// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", "CalendarGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupRoot",
	"since": 33,
	"type": "ELEMENT_TYPE",
	"id": 949,
	"rootId": "CHR1dGFub3RhAAO1",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 953, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 951, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 955,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 954, "since": 33, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 952, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"color": {"name": "color", "id": 957, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"name": {"name": "name", "id": 956, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"longEvents": {
			"name": "longEvents",
			"id": 959,
			"since": 33,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEvent",
			"final": true,
			"external": false
		},
		"shortEvents": {
			"name": "shortEvents",
			"id": 958,
			"since": 33,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEvent",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "33"
}

export function createCalendarGroupRoot(): CalendarGroupRoot {
	return create(_TypeModel, CalendarGroupRootTypeRef)
}
