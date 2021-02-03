// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 957,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGroupKey": {
			"id": 959,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"calendarEncCalendarGroupRootSessionKey": {
			"id": 958,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupInfoEncName": {
			"id": 962,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncGroupInfoSessionKey": {
			"id": 960,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncGroupKey": {
			"id": 961,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroup": {
			"id": 963,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarGroupData(values?: $Shape<$Exact<CalendarGroupData>>): CalendarGroupData {
	return Object.assign(create(_TypeModel, CalendarGroupDataTypeRef), values)
}

export type CalendarGroupData = {
	_type: TypeRef<CalendarGroupData>;

	_id: Id;
	adminEncGroupKey: ?Uint8Array;
	calendarEncCalendarGroupRootSessionKey: Uint8Array;
	groupInfoEncName: Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	userEncGroupKey: Uint8Array;

	adminGroup: ?Id;
}