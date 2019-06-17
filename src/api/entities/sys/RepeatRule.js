// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", "RepeatRule")
export const _TypeModel: TypeModel = {
	"name": "RepeatRule",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1545,
	"rootId": "A3N5cwAGCQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1546, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"endType": {"name": "endType", "id": 1548, "since": 47, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"endValue": {"name": "endValue", "id": 1549, "since": 47, "type": "Number", "cardinality": "ZeroOrOne", "final": false, "encrypted": true},
		"frequency": {"name": "frequency", "id": 1547, "since": 47, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"interval": {"name": "interval", "id": 1550, "since": 47, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"timeZone": {"name": "timeZone", "id": 1551, "since": 47, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "sys",
	"version": "47"
}

export function createRepeatRule(): RepeatRule {
	return create(_TypeModel, RepeatRuleTypeRef)
}
