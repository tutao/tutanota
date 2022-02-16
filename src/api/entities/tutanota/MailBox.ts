import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {SpamResults} from "./SpamResults.js"
import type {MailFolderRef} from "./MailFolderRef.js"

export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", "MailBox")
export const _TypeModel: TypeModel = {
	"name": "MailBox",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 125,
	"rootId": "CHR1dGFub3RhAH0",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 129,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 127,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 591,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 590,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 128,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastInfoDate": {
			"id": 569,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symEncShareBucketKey": {
			"id": 131,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"spamResults": {
			"id": 1220,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "SpamResults",
			"dependency": null
		},
		"systemFolders": {
			"id": 443,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailFolderRef",
			"dependency": null
		},
		"mails": {
			"id": 132,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Mail"
		},
		"receivedAttachments": {
			"id": 134,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		},
		"sentAttachments": {
			"id": 133,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createMailBox(values?: Partial<MailBox>): MailBox {
	return Object.assign(create(_TypeModel, MailBoxTypeRef), downcast<MailBox>(values))
}

export type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	lastInfoDate: Date;
	symEncShareBucketKey: null | Uint8Array;

	spamResults:  null | SpamResults;
	systemFolders:  null | MailFolderRef;
	mails: Id;
	receivedAttachments: Id;
	sentAttachments: Id;
}