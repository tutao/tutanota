// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 492,
			"since": 11,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncFileSessionKey": {
			"name": "ownerEncFileSessionKey",
			"id": 493,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"newFile": {
			"name": "newFile",
			"id": 494,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "NewDraftAttachment",
			"final": true
		},
		"existingFile": {
			"name": "existingFile",
			"id": 495,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createDraftAttachment(values?: $Shape<$Exact<DraftAttachment>>): DraftAttachment {
	return Object.assign(create(_TypeModel, DraftAttachmentTypeRef), values)
}
