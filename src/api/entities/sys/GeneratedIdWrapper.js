// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", "GeneratedIdWrapper")
export const _TypeModel: TypeModel = {
	"name": "GeneratedIdWrapper",
	"since": 32,
	"type": "AGGREGATED_TYPE",
	"id": 1349,
	"rootId": "A3N5cwAFRQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1350,
			"since": 32,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 1351,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createGeneratedIdWrapper(values?: $Shape<$Exact<GeneratedIdWrapper>>): GeneratedIdWrapper {
	return Object.assign(create(_TypeModel, GeneratedIdWrapperTypeRef), values)
}

export type GeneratedIdWrapper = {
	_type: TypeRef<GeneratedIdWrapper>;

	_id: Id;
	value: Id;
}