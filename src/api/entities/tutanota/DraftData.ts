import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {DraftAttachment} from "./DraftAttachment.js"
import type {DraftRecipient} from "./DraftRecipient.js"
import type {EncryptedMailAddress} from "./EncryptedMailAddress.js"

export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", "DraftData")
export const _TypeModel: TypeModel = {
	"name": "DraftData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 496,
	"rootId": "CHR1dGFub3RhAAHw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 497,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bodyText": {
			"id": 499,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"compressedBodyText": {
			"id": 1194,
			"type": "CompressedString",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"confidential": {
			"id": 502,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"method": {
			"id": 1116,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"senderMailAddress": {
			"id": 500,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderName": {
			"id": 501,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"subject": {
			"id": 498,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"addedAttachments": {
			"id": 506,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "DraftAttachment",
			"dependency": null
		},
		"bccRecipients": {
			"id": 505,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "DraftRecipient",
			"dependency": null
		},
		"ccRecipients": {
			"id": 504,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "DraftRecipient",
			"dependency": null
		},
		"removedAttachments": {
			"id": 507,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "File",
			"dependency": null
		},
		"replyTos": {
			"id": 819,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "EncryptedMailAddress",
			"dependency": null
		},
		"toRecipients": {
			"id": 503,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "DraftRecipient",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createDraftData(values?: Partial<DraftData>): DraftData {
	return Object.assign(create(_TypeModel, DraftDataTypeRef), downcast<DraftData>(values))
}

export type DraftData = {
	_type: TypeRef<DraftData>;

	_id: Id;
	bodyText: string;
	compressedBodyText: null | string;
	confidential: boolean;
	method: NumberString;
	senderMailAddress: string;
	senderName: string;
	subject: string;

	addedAttachments: DraftAttachment[];
	bccRecipients: DraftRecipient[];
	ccRecipients: DraftRecipient[];
	removedAttachments: IdTuple[];
	replyTos: EncryptedMailAddress[];
	toRecipients: DraftRecipient[];
}