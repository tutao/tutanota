import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "51"
}

export function createEntropyData(values?: Partial<EntropyData>): EntropyData {
	return Object.assign(create(_TypeModel, EntropyDataTypeRef), downcast<EntropyData>(values))
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;

	_format: NumberString;
	groupEncEntropy: Uint8Array;
}