import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
		"_id": {
			"id": 191,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastseenuid": {
			"id": 193,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"name": {
			"id": 192,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"uidvalidity": {
			"id": 194,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"syncInfo": {
			"id": 195,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "RemoteImapSyncInfo"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createImapFolder(values?: Partial<ImapFolder>): ImapFolder {
	return Object.assign(create(_TypeModel, ImapFolderTypeRef), downcast<ImapFolder>(values))
}

export type ImapFolder = {
	_type: TypeRef<ImapFolder>;

	_id: Id;
	lastseenuid: string;
	name: string;
	uidvalidity: string;

	syncInfo: Id;
}