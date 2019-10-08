// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 474,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"name": "symEncSessionKey",
			"id": 476,
			"since": 9,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"properties": {
			"name": "properties",
			"id": 475,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "TutanotaProperties",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createEncryptTutanotaPropertiesData(values?: $Shape<$Exact<EncryptTutanotaPropertiesData>>): EncryptTutanotaPropertiesData {
	return Object.assign(create(_TypeModel, EncryptTutanotaPropertiesDataTypeRef), values)
}
