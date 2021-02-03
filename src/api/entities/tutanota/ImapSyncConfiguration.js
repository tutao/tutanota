// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", "ImapSyncConfiguration")
export const _TypeModel: TypeModel = {
	"name": "ImapSyncConfiguration",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 209,
	"rootId": "CHR1dGFub3RhAADR",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 210,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"host": {
			"id": 211,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"password": {
			"id": 214,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"port": {
			"id": 212,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"user": {
			"id": 213,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"imapSyncState": {
			"id": 215,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "ImapSyncState"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createImapSyncConfiguration(values?: $Shape<$Exact<ImapSyncConfiguration>>): ImapSyncConfiguration {
	return Object.assign(create(_TypeModel, ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfiguration = {
	_type: TypeRef<ImapSyncConfiguration>;

	_id: Id;
	host: string;
	password: string;
	port: NumberString;
	user: string;

	imapSyncState: ?Id;
}