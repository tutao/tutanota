// @flow

import {create} from "../../common/utils/EntityUtils"

import type {ImapFolder} from "./ImapFolder"
import {TypeRef} from "../../common/utils/TypeRef";

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
			"id": 200,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 198,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 595,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 199,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"folders": {
			"id": 201,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ImapFolder"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createImapSyncState(values?: $Shape<$Exact<ImapSyncState>>): ImapSyncState {
	return Object.assign(create(_TypeModel, ImapSyncStateTypeRef), values)
}

export type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	folders: ImapFolder[];
}