// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", "DraftData")
export const _TypeModel: TypeModel = {
	"name": "DraftData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 497,
	"rootId": "CHR1dGFub3RhAAHx",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 498, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bodyText": {"name": "bodyText", "id": 500, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": true},
		"confidential": {"name": "confidential", "id": 503, "since": 11, "type": "Boolean", "cardinality": "One", "final": true, "encrypted": true},
		"senderMailAddress": {"name": "senderMailAddress", "id": 501, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"senderName": {"name": "senderName", "id": 502, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": true},
		"subject": {"name": "subject", "id": 499, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {
		"addedAttachments": {
			"name": "addedAttachments",
			"id": 507,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DraftAttachment",
			"final": true
		},
		"bccRecipients": {
			"name": "bccRecipients",
			"id": 506,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DraftRecipient",
			"final": true
		},
		"ccRecipients": {
			"name": "ccRecipients",
			"id": 505,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DraftRecipient",
			"final": true
		},
		"replyTos": {
			"name": "replyTos",
			"id": 820,
			"since": 21,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EncryptedMailAddress",
			"final": false
		},
		"toRecipients": {
			"name": "toRecipients",
			"id": 504,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DraftRecipient",
			"final": true
		},
		"removedAttachments": {
			"name": "removedAttachments",
			"id": 508,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createDraftData(): DraftData {
	return create(_TypeModel, DraftDataTypeRef)
}
