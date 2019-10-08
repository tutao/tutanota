// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", "ImapSyncState")
export const _TypeModel: TypeModel = {
	"name": "ImapSyncState",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 196,
	"rootId": "CHR1dGFub3RhAADE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 200,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 198, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 595,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 199,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"folders": {
			"name": "folders",
			"id": 201,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ImapFolder",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createImapSyncState(values?: $Shape<$Exact<ImapSyncState>>): ImapSyncState {
	return Object.assign(create(_TypeModel, ImapSyncStateTypeRef), values)
}
