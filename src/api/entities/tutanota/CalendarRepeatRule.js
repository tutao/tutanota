// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", "CalendarRepeatRule")
export const _TypeModel: TypeModel = {
	"name": "CalendarRepeatRule",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 926,
	"rootId": "CHR1dGFub3RhAAOe",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 927, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"endType": {"name": "endType", "id": 929, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"endValue": {
			"name": "endValue",
			"id": 930,
			"since": 33,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"frequency": {
			"name": "frequency",
			"id": 928,
			"since": 33,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"interval": {"name": "interval", "id": 931, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"timeZone": {"name": "timeZone", "id": 932, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createCalendarRepeatRule(values?: $Shape<$Exact<CalendarRepeatRule>>): CalendarRepeatRule {
	return Object.assign(create(_TypeModel, CalendarRepeatRuleTypeRef), values)
}
