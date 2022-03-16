import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 187,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 185,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 594,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 186,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"seen": {
			"id": 189,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"message": {
			"id": 188,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Mail",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createRemoteImapSyncInfo(values?: Partial<RemoteImapSyncInfo>): RemoteImapSyncInfo {
	return Object.assign(create(_TypeModel, RemoteImapSyncInfoTypeRef), downcast<RemoteImapSyncInfo>(values))
}

export type RemoteImapSyncInfo = {
	_type: TypeRef<RemoteImapSyncInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	seen: boolean;

	message: IdTuple;
}