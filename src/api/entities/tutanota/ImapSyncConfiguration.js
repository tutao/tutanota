// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", "ImapSyncConfiguration")
export const _TypeModel: TypeModel = {
	"name": "ImapSyncConfiguration",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 210,
	"rootId": "CHR1dGFub3RhAADS",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 211, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"host": {"name": "host", "id": 212, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"password": {"name": "password", "id": 215, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"port": {"name": "port", "id": 213, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"user": {"name": "user", "id": 214, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"imapSyncState": {
			"name": "imapSyncState",
			"id": 216,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "ImapSyncState",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createImapSyncConfiguration(): ImapSyncConfiguration {
	return create(_TypeModel, ImapSyncConfigurationTypeRef)
}
