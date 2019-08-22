// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ReadCounterDataTypeRef: TypeRef<ReadCounterData> = new TypeRef("monitor", "ReadCounterData")
export const _TypeModel: TypeModel = {
	"name": "ReadCounterData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 12,
	"rootId": "B21vbml0b3IADA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 13,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monitor": {"name": "monitor", "id": 14, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"owner": {"name": "owner", "id": 15, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "monitor",
	"version": "10"
}

export function createReadCounterData(values?: $Shape<$Exact<ReadCounterData>>): ReadCounterData {
	return Object.assign(create(_TypeModel, ReadCounterDataTypeRef), values)
}
