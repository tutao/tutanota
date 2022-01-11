import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const StringConfigValueTypeRef: TypeRef<StringConfigValue> = new TypeRef("sys", "StringConfigValue")
export const _TypeModel: TypeModel = {
	"name": "StringConfigValue",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 515,
	"rootId": "A3N5cwACAw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 516,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 517,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 518,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createStringConfigValue(values?: Partial<StringConfigValue>): StringConfigValue {
	return Object.assign(create(_TypeModel, StringConfigValueTypeRef), downcast<StringConfigValue>(values))
}

export type StringConfigValue = {
	_type: TypeRef<StringConfigValue>;

	_id: Id;
	name: string;
	value: string;
}