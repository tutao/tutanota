// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {DraftAttachment} from "./DraftAttachment"
import type {DraftRecipient} from "./DraftRecipient"
import type {EncryptedMailAddress} from "./EncryptedMailAddress"

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
		},
		"removedAttachments": {
			"id": 507,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "48"
}

export function createDraftData(values?: $Shape<$Exact<DraftData>>): DraftData {
	return Object.assign(create(_TypeModel, DraftDataTypeRef), values)
}

export type DraftData = {
	_type: TypeRef<DraftData>;

	_id: Id;
	bodyText: string;
	compressedBodyText: ?string;
	confidential: boolean;
	method: NumberString;
	senderMailAddress: string;
	senderName: string;
	subject: string;

	addedAttachments: DraftAttachment[];
	bccRecipients: DraftRecipient[];
	ccRecipients: DraftRecipient[];
	replyTos: EncryptedMailAddress[];
	toRecipients: DraftRecipient[];
	removedAttachments: IdTuple[];
}