import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 1558,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"endType": {
			"id": 1560,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"endValue": {
			"id": 1561,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"frequency": {
			"id": 1559,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"interval": {
			"id": 1562,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"timeZone": {
			"id": 1563,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createRepeatRule(values?: Partial<RepeatRule>): RepeatRule {
	return Object.assign(create(_TypeModel, RepeatRuleTypeRef), downcast<RepeatRule>(values))
}

export type RepeatRule = {
	_type: TypeRef<RepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: null | NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;
}