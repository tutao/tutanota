// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", "EncryptTutanotaPropertiesData")
export const _TypeModel: TypeModel = {
	"name": "EncryptTutanotaPropertiesData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 473,
	"rootId": "CHR1dGFub3RhAAHZ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 474,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"id": 476,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"properties": {
			"id": 475,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "TutanotaProperties"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createEncryptTutanotaPropertiesData(values?: $Shape<$Exact<EncryptTutanotaPropertiesData>>): EncryptTutanotaPropertiesData {
	return Object.assign(create(_TypeModel, EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;

	_format: NumberString;
	symEncSessionKey: Uint8Array;

	properties: Id;
}