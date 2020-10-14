// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", "RepeatRule")
export const _TypeModel: TypeModel = {
	"name": "RepeatRule",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1557,
	"rootId": "A3N5cwAGFQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1558,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"endType": {
			"name": "endType",
			"id": 1560,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"endValue": {
			"name": "endValue",
			"id": 1561,
			"since": 48,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"frequency": {
			"name": "frequency",
			"id": 1559,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"interval": {
			"name": "interval",
			"id": 1562,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"timeZone": {
			"name": "timeZone",
			"id": 1563,
			"since": 48,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRepeatRule(values?: $Shape<$Exact<RepeatRule>>): RepeatRule {
	return Object.assign(create(_TypeModel, RepeatRuleTypeRef), values)
}

export type RepeatRule = {
	_type: TypeRef<RepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: ?NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;
}