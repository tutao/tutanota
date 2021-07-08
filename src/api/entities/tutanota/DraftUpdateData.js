// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {DraftData} from "./DraftData"

export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", "DraftUpdateData")
export const _TypeModel: TypeModel = {
	"name": "DraftUpdateData",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 519,
	"rootId": "CHR1dGFub3RhAAIH",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 520,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"draftData": {
			"id": 521,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "DraftData"
		},
		"draft": {
			"id": 522,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createDraftUpdateData(values?: $Shape<$Exact<DraftUpdateData>>): DraftUpdateData {
	return Object.assign(create(_TypeModel, DraftUpdateDataTypeRef), values)
}

export type DraftUpdateData = {
	_type: TypeRef<DraftUpdateData>;
	_errors: Object;

	_format: NumberString;

	draftData: DraftData;
	draft: IdTuple;
}