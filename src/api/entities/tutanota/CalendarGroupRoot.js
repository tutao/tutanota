// @flow

import {create} from "../../common/utils/EntityUtils"

import type {CalendarEventIndexRef} from "./CalendarEventIndexRef"
import {TypeRef} from "../../common/utils/TypeRef";

export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", "CalendarGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "CalendarGroupRoot",
	"since": 33,
	"type": "ELEMENT_TYPE",
	"id": 947,
	"rootId": "CHR1dGFub3RhAAOz",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 951,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 949,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 953,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 952,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 950,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"index": {
			"id": 1103,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CalendarEventIndexRef"
		},
		"longEvents": {
			"id": 955,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CalendarEvent"
		},
		"shortEvents": {
			"id": 954,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CalendarEvent"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarGroupRoot(values?: $Shape<$Exact<CalendarGroupRoot>>): CalendarGroupRoot {
	return Object.assign(create(_TypeModel, CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRoot = {
	_type: TypeRef<CalendarGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;

	index: ?CalendarEventIndexRef;
	longEvents: Id;
	shortEvents: Id;
}