// @flow

import {create} from "../../common/utils/EntityUtils"

import type {MailAddress} from "./MailAddress"
import type {EncryptedMailAddress} from "./EncryptedMailAddress"
import type {MailRestriction} from "./MailRestriction"
import {TypeRef} from "../../common/utils/TypeRef";

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
		"_area": {
			"id": 104,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"id": 101,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 99,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"id": 103,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 102,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 587,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 100,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authStatus": {
			"id": 1022,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"confidential": {
			"id": 426,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"differentEnvelopeSender": {
			"id": 617,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"listUnsubscribe": {
			"id": 866,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"method": {
			"id": 1120,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"movedTime": {
			"id": 896,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"phishingStatus": {
			"id": 1021,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"receivedDate": {
			"id": 107,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"replyType": {
			"id": 466,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sentDate": {
			"id": 106,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"state": {
			"id": 108,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"subject": {
			"id": 105,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"trashed": {
			"id": 110,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"unread": {
			"id": 109,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bccRecipients": {
			"id": 114,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "MailAddress"
		},
		"ccRecipients": {
			"id": 113,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "MailAddress"
		},
		"replyTos": {
			"id": 616,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "EncryptedMailAddress"
		},
		"restrictions": {
			"id": 723,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailRestriction"
		},
		"sender": {
			"id": 111,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailAddress"
		},
		"toRecipients": {
			"id": 112,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "MailAddress"
		},
		"attachments": {
			"id": 115,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "File"
		},
		"body": {
			"id": 116,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailBody"
		},
		"conversationEntry": {
			"id": 117,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "ConversationEntry"
		},
		"headers": {
			"id": 618,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailHeaders"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createMail(values?: $Shape<$Exact<Mail>>): Mail {
	return Object.assign(create(_TypeModel, MailTypeRef), values)
}

export type Mail = {
	_type: TypeRef<Mail>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	authStatus: NumberString;
	confidential: boolean;
	differentEnvelopeSender: ?string;
	listUnsubscribe: boolean;
	method: NumberString;
	movedTime: ?Date;
	phishingStatus: NumberString;
	receivedDate: Date;
	replyType: NumberString;
	sentDate: Date;
	state: NumberString;
	subject: string;
	trashed: boolean;
	unread: boolean;

	bccRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	replyTos: EncryptedMailAddress[];
	restrictions: ?MailRestriction;
	sender: MailAddress;
	toRecipients: MailAddress[];
	attachments: IdTuple[];
	body: Id;
	conversationEntry: IdTuple;
	headers: ?Id;
}