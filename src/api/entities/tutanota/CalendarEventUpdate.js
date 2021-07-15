// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1108,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1106,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1110,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1109,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1107,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sender": {
			"id": 1111,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"file": {
			"id": 1112,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "46"
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