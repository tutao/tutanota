import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const ReadCounterReturnTypeRef: TypeRef<ReadCounterReturn> = new TypeRef("monitor", "ReadCounterReturn")
export const _TypeModel: TypeModel = {
	"name": "ReadCounterReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 16,
	"rootId": "B21vbml0b3IAEA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 17,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 18,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "monitor",
	"version": "19"
}

export function createReadCounterReturn(values?: Partial<ReadCounterReturn>): ReadCounterReturn {
	return Object.assign(create(_TypeModel, ReadCounterReturnTypeRef), downcast<ReadCounterReturn>(values))
}

export type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;

	_format: NumberString;
	value: null | NumberString;
}