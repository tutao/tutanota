// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "15"
}

export function createReadCounterReturn(values?: $Shape<$Exact<ReadCounterReturn>>): ReadCounterReturn {
	return Object.assign(create(_TypeModel, ReadCounterReturnTypeRef), values)
}

export type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;

	_format: NumberString;
	value: ?NumberString;
}