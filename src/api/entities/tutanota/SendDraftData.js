// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", "SendDraftData")
export const _TypeModel: TypeModel = {
	"name": "SendDraftData",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 548,
	"rootId": "CHR1dGFub3RhAAIk",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 549, "since": 11, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"bucketEncMailSessionKey": {
			"name": "bucketEncMailSessionKey",
			"id": 552,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"language": {"name": "language", "id": 550, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"mailSessionKey": {"name": "mailSessionKey", "id": 551, "since": 11, "type": "Bytes", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"plaintext": {"name": "plaintext", "id": 676, "since": 18, "type": "Boolean", "cardinality": "One", "final": true, "encrypted": false},
		"senderNameUnencrypted": {
			"name": "senderNameUnencrypted",
			"id": 553,
			"since": 11,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"attachmentKeyData": {
			"name": "attachmentKeyData",
			"id": 556,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AttachmentKeyData",
			"final": true
		},
		"internalRecipientKeyData": {
			"name": "internalRecipientKeyData",
			"id": 554,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InternalRecipientKeyData",
			"final": true
		},
		"secureExternalRecipientKeyData": {
			"name": "secureExternalRecipientKeyData",
			"id": 555,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "SecureExternalRecipientKeyData",
			"final": true
		},
		"mail": {
			"name": "mail",
			"id": 557,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createSendDraftData(): SendDraftData {
	return create(_TypeModel, SendDraftDataTypeRef)
}
