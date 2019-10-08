// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", "Mail")
export const _TypeModel: TypeModel = {
	"name": "Mail",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 97,
	"rootId": "CHR1dGFub3RhAGE",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_area": {"name": "_area", "id": 104, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"_format": {"name": "_format", "id": 101, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 99, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_owner": {"name": "_owner", "id": 103, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 102,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 587,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 100,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"confidential": {
			"name": "confidential",
			"id": 426,
			"since": 6,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"differentEnvelopeSender": {
			"name": "differentEnvelopeSender",
			"id": 617,
			"since": 14,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"listUnsubscribe": {
			"name": "listUnsubscribe",
			"id": 866,
			"since": 24,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"movedTime": {
			"name": "movedTime",
			"id": 896,
			"since": 30,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"receivedDate": {
			"name": "receivedDate",
			"id": 107,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"replyType": {
			"name": "replyType",
			"id": 466,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sentDate": {"name": "sentDate", "id": 106, "since": 1, "type": "Date", "cardinality": "One", "final": true, "encrypted": false},
		"state": {"name": "state", "id": 108, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"subject": {"name": "subject", "id": 105, "since": 1, "type": "String", "cardinality": "One", "final": true, "encrypted": true},
		"trashed": {"name": "trashed", "id": 110, "since": 1, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false},
		"unread": {"name": "unread", "id": 109, "since": 1, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"bccRecipients": {
			"name": "bccRecipients",
			"id": 114,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "MailAddress",
			"final": true
		},
		"ccRecipients": {
			"name": "ccRecipients",
			"id": 113,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "MailAddress",
			"final": true
		},
		"replyTos": {
			"name": "replyTos",
			"id": 616,
			"since": 14,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EncryptedMailAddress",
			"final": true
		},
		"restrictions": {
			"name": "restrictions",
			"id": 723,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "MailRestriction",
			"final": true
		},
		"sender": {
			"name": "sender",
			"id": 111,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "MailAddress",
			"final": true
		},
		"toRecipients": {
			"name": "toRecipients",
			"id": 112,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "MailAddress",
			"final": true
		},
		"attachments": {
			"name": "attachments",
			"id": 115,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "File",
			"final": true,
			"external": false
		},
		"body": {
			"name": "body",
			"id": 116,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailBody",
			"final": true,
			"external": false
		},
		"conversationEntry": {
			"name": "conversationEntry",
			"id": 117,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "ConversationEntry",
			"final": true,
			"external": false
		},
		"headers": {
			"name": "headers",
			"id": 618,
			"since": 14,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "MailHeaders",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createMail(values?: $Shape<$Exact<Mail>>): Mail {
	return Object.assign(create(_TypeModel, MailTypeRef), values)
}
