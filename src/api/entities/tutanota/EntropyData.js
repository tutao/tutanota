// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", "EntropyData")
export const _TypeModel: TypeModel = {
	"name": "EntropyData",
	"since": 43,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1122,
	"rootId": "CHR1dGFub3RhAARi",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1123,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupEncEntropy": {
			"id": 1124,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createEntropyData(values?: $Shape<$Exact<EntropyData>>): EntropyData {
	return Object.assign(create(_TypeModel, EntropyDataTypeRef), values)
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;

	_format: NumberString;
	groupEncEntropy: Uint8Array;
}