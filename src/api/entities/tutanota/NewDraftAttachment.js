// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", "NewDraftAttachment")
export const _TypeModel: TypeModel = {
	"name": "NewDraftAttachment",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 486,
	"rootId": "CHR1dGFub3RhAAHm",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 487,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"encCid": {
			"id": 925,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"encFileName": {
			"id": 488,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"encMimeType": {
			"id": 489,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"fileData": {
			"id": 490,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "FileData"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createNewDraftAttachment(values?: $Shape<$Exact<NewDraftAttachment>>): NewDraftAttachment {
	return Object.assign(create(_TypeModel, NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;

	_id: Id;
	encCid: ?Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;

	fileData: Id;
}