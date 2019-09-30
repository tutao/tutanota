// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 17,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {"name": "value", "id": 18, "since": 1, "type": "Number", "cardinality": "ZeroOrOne", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "monitor",
	"version": "10"
}

export function createReadCounterReturn(values?: $Shape<$Exact<ReadCounterReturn>>): ReadCounterReturn {
	return Object.assign(create(_TypeModel, ReadCounterReturnTypeRef), values)
}
