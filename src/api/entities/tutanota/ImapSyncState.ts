import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {ImapFolder} from "./ImapFolder.js"

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
			"refType": "ImapFolder",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createImapSyncState(values?: Partial<ImapSyncState>): ImapSyncState {
	return Object.assign(create(_TypeModel, ImapSyncStateTypeRef), downcast<ImapSyncState>(values))
}

export type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	folders: ImapFolder[];
}