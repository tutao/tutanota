// @flow

import {create} from "../../common/utils/EntityUtils"

import type {MailFolderRef} from "./MailFolderRef"
import {TypeRef} from "../../common/utils/TypeRef";

export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", "MailBox")
export const _TypeModel: TypeModel = {
	"name": "MailBox",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 125,
	"rootId": "CHR1dGFub3RhAH0",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 129,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 127,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 591,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 590,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 128,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastInfoDate": {
			"id": 569,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symEncShareBucketKey": {
			"id": 131,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"systemFolders": {
			"id": 443,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailFolderRef"
		},
		"mails": {
			"id": 132,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Mail"
		},
		"receivedAttachments": {
			"id": 134,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		},
		"sentAttachments": {
			"id": 133,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createMailBox(values?: $Shape<$Exact<MailBox>>): MailBox {
	return Object.assign(create(_TypeModel, MailBoxTypeRef), values)
}

export type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	lastInfoDate: Date;
	symEncShareBucketKey: ?Uint8Array;

	systemFolders: ?MailFolderRef;
	mails: Id;
	receivedAttachments: Id;
	sentAttachments: Id;
}