import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 729,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 730,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createStringWrapper(values?: Partial<StringWrapper>): StringWrapper {
	return Object.assign(create(_TypeModel, StringWrapperTypeRef), downcast<StringWrapper>(values))
}

export type StringWrapper = {
	_type: TypeRef<StringWrapper>;

	_id: Id;
	value: string;
}