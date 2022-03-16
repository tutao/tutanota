import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1350,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1351,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createGeneratedIdWrapper(values?: Partial<GeneratedIdWrapper>): GeneratedIdWrapper {
	return Object.assign(create(_TypeModel, GeneratedIdWrapperTypeRef), downcast<GeneratedIdWrapper>(values))
}

export type GeneratedIdWrapper = {
	_type: TypeRef<GeneratedIdWrapper>;

	_id: Id;
	value: Id;
}