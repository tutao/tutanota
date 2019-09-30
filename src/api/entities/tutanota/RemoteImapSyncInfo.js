// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", "RemoteImapSyncInfo")
export const _TypeModel: TypeModel = {
	"name": "RemoteImapSyncInfo",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 183,
	"rootId": "CHR1dGFub3RhAAC3",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 187,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 185, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 594,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 186,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"seen": {"name": "seen", "id": 189, "since": 1, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"message": {
			"name": "message",
			"id": 188,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createRemoteImapSyncInfo(values?: $Shape<$Exact<RemoteImapSyncInfo>>): RemoteImapSyncInfo {
	return Object.assign(create(_TypeModel, RemoteImapSyncInfoTypeRef), values)
}
