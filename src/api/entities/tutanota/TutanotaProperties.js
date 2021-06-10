// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {ImapSyncConfiguration} from "./ImapSyncConfiguration"
import type {InboxRule} from "./InboxRule"

export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", "TutanotaProperties")
export const _TypeModel: TypeModel = {
	"name": "TutanotaProperties",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 216,
	"rootId": "CHR1dGFub3RhAADY",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 220,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 218,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 598,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 597,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 219,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customEmailSignature": {
			"id": 471,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"defaultSender": {
			"id": 469,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"defaultUnconfidential": {
			"id": 470,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"emailSignatureType": {
			"id": 472,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupEncEntropy": {
			"id": 410,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"lastSeenAnnouncement": {
			"id": 897,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"noAutomaticContacts": {
			"id": 568,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"notificationMailLanguage": {
			"id": 418,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"sendPlaintextOnly": {
			"id": 676,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"imapSyncConfig": {
			"id": 222,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ImapSyncConfiguration"
		},
		"inboxRules": {
			"id": 578,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "InboxRule"
		},
		"lastPushedMail": {
			"id": 221,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createTutanotaProperties(values?: $Shape<$Exact<TutanotaProperties>>): TutanotaProperties {
	return Object.assign(create(_TypeModel, TutanotaPropertiesTypeRef), values)
}

export type TutanotaProperties = {
	_type: TypeRef<TutanotaProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	customEmailSignature: string;
	defaultSender: ?string;
	defaultUnconfidential: boolean;
	emailSignatureType: NumberString;
	groupEncEntropy: ?Uint8Array;
	lastSeenAnnouncement: NumberString;
	noAutomaticContacts: boolean;
	notificationMailLanguage: ?string;
	sendPlaintextOnly: boolean;

	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
	lastPushedMail: ?IdTuple;
}