// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailFolderTypeRef: TypeRef<MailFolder> = new TypeRef("tutanota", "MailFolder")
export const _TypeModel: TypeModel = {
	"name": "MailFolder",
	"since": 7,
	"type": "LIST_ELEMENT_TYPE",
	"id": 429,
	"rootId": "CHR1dGFub3RhAAGt",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 433,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 431, "since": 7, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 434,
			"since": 7,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 589,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 432,
			"since": 7,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"folderType": {
			"name": "folderType",
			"id": 436,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {"name": "name", "id": 435, "since": 7, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"mails": {
			"name": "mails",
			"id": 437,
			"since": 7,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": true,
			"external": false
		},
		"parentFolder": {
			"name": "parentFolder",
			"id": 439,
			"since": 7,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "MailFolder",
			"final": true,
			"external": false
		},
		"subFolders": {
			"name": "subFolders",
			"id": 438,
			"since": 7,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailFolder",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createMailFolder(values?: $Shape<$Exact<MailFolder>>): MailFolder {
	return Object.assign(create(_TypeModel, MailFolderTypeRef), values)
}
