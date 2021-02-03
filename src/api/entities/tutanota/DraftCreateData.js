// @flow

import {create} from "../../common/utils/EntityUtils"

import type {DraftData} from "./DraftData"
import {TypeRef} from "../../common/utils/TypeRef";

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
			"id": 509,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"conversationType": {
			"id": 511,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"id": 512,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"previousMessageId": {
			"id": 510,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncSessionKey": {
			"id": 513,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"draftData": {
			"id": 515,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "DraftData"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createDraftCreateData(values?: $Shape<$Exact<DraftCreateData>>): DraftCreateData {
	return Object.assign(create(_TypeModel, DraftCreateDataTypeRef), values)
}

export type DraftCreateData = {
	_type: TypeRef<DraftCreateData>;
	_errors: Object;

	_format: NumberString;
	conversationType: NumberString;
	ownerEncSessionKey: Uint8Array;
	previousMessageId: ?string;
	symEncSessionKey: Uint8Array;

	draftData: DraftData;
}