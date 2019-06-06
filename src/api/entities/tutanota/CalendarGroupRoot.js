// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", "CalendarGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupRoot",
	"since": 33,
	"type": "ELEMENT_TYPE",
	"id": 955,
	"rootId": "CHR1dGFub3RhAAO7",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 959, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 957, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 961,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 960, "since": 33, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 958, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"color": {"name": "color", "id": 963, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"name": {"name": "name", "id": 962, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"longEvents": {
			"name": "longEvents",
			"id": 965,
			"since": 33,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEvent",
			"final": true,
			"external": false
		},
		"shortEvents": {
			"name": "shortEvents",
			"id": 964,
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
