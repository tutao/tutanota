// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 129,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 127, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 591,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 590,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 128,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastInfoDate": {
			"name": "lastInfoDate",
			"id": 569,
			"since": 12,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symEncShareBucketKey": {
			"name": "symEncShareBucketKey",
			"id": 131,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"systemFolders": {
			"name": "systemFolders",
			"id": 443,
			"since": 7,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "MailFolderRef",
			"final": true
		},
		"mails": {
			"name": "mails",
			"id": 132,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": true,
			"external": false
		},
		"receivedAttachments": {
			"name": "receivedAttachments",
			"id": 134,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		},
		"sentAttachments": {
			"name": "sentAttachments",
			"id": 133,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createMailBox(values?: $Shape<$Exact<MailBox>>): MailBox {
	return Object.assign(create(_TypeModel, MailBoxTypeRef), values)
}
