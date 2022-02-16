import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {NewDraftAttachment} from "./NewDraftAttachment.js"

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
			"refType": "NewDraftAttachment",
			"dependency": null
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
	"version": "51"
}

export function createDraftAttachment(values?: Partial<DraftAttachment>): DraftAttachment {
	return Object.assign(create(_TypeModel, DraftAttachmentTypeRef), downcast<DraftAttachment>(values))
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;

	newFile:  null | NewDraftAttachment;
	existingFile:  null | IdTuple;
}