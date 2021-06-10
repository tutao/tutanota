// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
		"_id": {
			"id": 927,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"endType": {
			"id": 929,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"endValue": {
			"id": 930,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"frequency": {
			"id": 928,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"interval": {
			"id": 931,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"timeZone": {
			"id": 932,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createCalendarRepeatRule(values?: $Shape<$Exact<CalendarRepeatRule>>): CalendarRepeatRule {
	return Object.assign(create(_TypeModel, CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRule = {
	_type: TypeRef<CalendarRepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: ?NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;
}