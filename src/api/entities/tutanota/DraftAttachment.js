// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {NewDraftAttachment} from "./NewDraftAttachment"

export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", "DraftAttachment")
export const _TypeModel: TypeModel = {
	"name": "DraftAttachment",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 491,
	"rootId": "CHR1dGFub3RhAAHr",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 492,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncFileSessionKey": {
			"id": 493,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"newFile": {
			"id": 494,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "NewDraftAttachment"
		},
		"existingFile": {
			"id": 495,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createDraftAttachment(values?: $Shape<$Exact<DraftAttachment>>): DraftAttachment {
	return Object.assign(create(_TypeModel, DraftAttachmentTypeRef), values)
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;

	newFile: ?NewDraftAttachment;
	existingFile: ?IdTuple;
}