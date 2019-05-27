// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("tutanota", "RepeatRule")
export const _TypeModel: TypeModel = {
	"name": "RepeatRule",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 929,
	"rootId": "CHR1dGFub3RhAAOh",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 930, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"endType": {"name": "endType", "id": 932, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"endValue": {"name": "endValue", "id": 933, "since": 33, "type": "Number", "cardinality": "ZeroOrOne", "final": false, "encrypted": true},
		"frequency": {"name": "frequency", "id": 931, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"interval": {"name": "interval", "id": 934, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"timeZone": {"name": "timeZone", "id": 935, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"exceptionDates": {
			"name": "exceptionDates",
			"id": 936,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EncDateWrapper",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "33"
}

export function createRepeatRule(): RepeatRule {
	return create(_TypeModel, RepeatRuleTypeRef)
}
