// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 13,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monitor": {
			"id": 14,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"owner": {
			"id": 15,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "monitor",
	"version": "15"
}

export function createReadCounterData(values?: $Shape<$Exact<ReadCounterData>>): ReadCounterData {
	return Object.assign(create(_TypeModel, ReadCounterDataTypeRef), values)
}

export type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;

	_format: NumberString;
	monitor: string;
	owner: Id;
}