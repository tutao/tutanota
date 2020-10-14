// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", "StringWrapper")
export const _TypeModel: TypeModel = {
	"name": "StringWrapper",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 728,
	"rootId": "A3N5cwAC2A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 729,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 730,
			"since": 9,
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

export function createStringWrapper(values?: $Shape<$Exact<StringWrapper>>): StringWrapper {
	return Object.assign(create(_TypeModel, StringWrapperTypeRef), values)
}

export type StringWrapper = {
	_type: TypeRef<StringWrapper>;

	_id: Id;
	value: string;
}