// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", "SendDraftData")
export const _TypeModel: TypeModel = {
	"name": "SendDraftData",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 547,
	"rootId": "CHR1dGFub3RhAAIj",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 548,
			"since": 11,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"bucketEncMailSessionKey": {
			"name": "bucketEncMailSessionKey",
			"id": 551,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"language": {"name": "language", "id": 549, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"mailSessionKey": {
			"name": "mailSessionKey",
			"id": 550,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"plaintext": {
			"name": "plaintext",
			"id": 675,
			"since": 18,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderNameUnencrypted": {
			"name": "senderNameUnencrypted",
			"id": 552,
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
			"id": 555,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AttachmentKeyData",
			"final": true
		},
		"internalRecipientKeyData": {
			"name": "internalRecipientKeyData",
			"id": 553,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InternalRecipientKeyData",
			"final": true
		},
		"secureExternalRecipientKeyData": {
			"name": "secureExternalRecipientKeyData",
			"id": 554,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "SecureExternalRecipientKeyData",
			"final": true
		},
		"mail": {
			"name": "mail",
			"id": 556,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createSendDraftData(values?: $Shape<$Exact<SendDraftData>>): SendDraftData {
	return Object.assign(create(_TypeModel, SendDraftDataTypeRef), values)
}
