// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", "CalendarEventUpdate")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUpdate",
	"since": 42,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1104,
	"rootId": "CHR1dGFub3RhAARQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1108,
			"since": 42,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1106,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1110,
			"since": 42,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1109,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1107,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sender": {
			"name": "sender",
			"id": 1111,
			"since": 42,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 1112,
			"since": 42,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEventUpdate(values?: $Shape<$Exact<CalendarEventUpdate>>): CalendarEventUpdate {
	return Object.assign(create(_TypeModel, CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdate = {
	_type: TypeRef<CalendarEventUpdate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	sender: string;

	file: IdTuple;
}