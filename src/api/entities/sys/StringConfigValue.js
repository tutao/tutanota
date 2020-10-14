// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 516,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 517,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 518,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createStringConfigValue(values?: $Shape<$Exact<StringConfigValue>>): StringConfigValue {
	return Object.assign(create(_TypeModel, StringConfigValueTypeRef), values)
}

export type StringConfigValue = {
	_type: TypeRef<StringConfigValue>;

	_id: Id;
	name: string;
	value: string;
}