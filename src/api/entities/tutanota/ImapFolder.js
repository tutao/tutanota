// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", "ImapFolder")
export const _TypeModel: TypeModel = {
	"name": "ImapFolder",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 190,
	"rootId": "CHR1dGFub3RhAAC-",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 191, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"lastseenuid": {
			"name": "lastseenuid",
			"id": 193,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"name": {"name": "name", "id": 192, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"uidvalidity": {
			"name": "uidvalidity",
			"id": 194,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"syncInfo": {
			"name": "syncInfo",
			"id": 195,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "RemoteImapSyncInfo",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createImapFolder(values?: $Shape<$Exact<ImapFolder>>): ImapFolder {
	return Object.assign(create(_TypeModel, ImapFolderTypeRef), values)
}
