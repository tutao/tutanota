import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 433,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 431,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 434,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 589,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 432,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"folderType": {
			"id": 436,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 435,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"mails": {
			"id": 437,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Mail",
			"dependency": null
		},
		"parentFolder": {
			"id": 439,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailFolder",
			"dependency": null
		},
		"subFolders": {
			"id": 438,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailFolder",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createMailFolder(values?: Partial<MailFolder>): MailFolder {
	return Object.assign(create(_TypeModel, MailFolderTypeRef), downcast<MailFolder>(values))
}

export type MailFolder = {
	_type: TypeRef<MailFolder>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	folderType: NumberString;
	name: string;

	mails: Id;
	parentFolder:  null | IdTuple;
	subFolders: Id;
}