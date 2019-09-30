// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", "DraftCreateData")
export const _TypeModel: TypeModel = {
	"name": "DraftCreateData",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 508,
	"rootId": "CHR1dGFub3RhAAH8",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 509,
			"since": 11,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"conversationType": {
			"name": "conversationType",
			"id": 511,
			"since": 11,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"name": "ownerEncSessionKey",
			"id": 512,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"previousMessageId": {
			"name": "previousMessageId",
			"id": 510,
			"since": 11,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncSessionKey": {
			"name": "symEncSessionKey",
			"id": 513,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"draftData": {
			"name": "draftData",
			"id": 515,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "DraftData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createDraftCreateData(values?: $Shape<$Exact<DraftCreateData>>): DraftCreateData {
	return Object.assign(create(_TypeModel, DraftCreateDataTypeRef), values)
}
