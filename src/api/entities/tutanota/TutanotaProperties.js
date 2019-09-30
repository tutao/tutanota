// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
		"_format": {"name": "_format", "id": 220, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 218, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 598,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 597,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 219,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customEmailSignature": {
			"name": "customEmailSignature",
			"id": 471,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"defaultSender": {
			"name": "defaultSender",
			"id": 469,
			"since": 8,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"defaultUnconfidential": {
			"name": "defaultUnconfidential",
			"id": 470,
			"since": 8,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"emailSignatureType": {
			"name": "emailSignatureType",
			"id": 472,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupEncEntropy": {
			"name": "groupEncEntropy",
			"id": 410,
			"since": 2,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"lastSeenAnnouncement": {
			"name": "lastSeenAnnouncement",
			"id": 897,
			"since": 30,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"noAutomaticContacts": {
			"name": "noAutomaticContacts",
			"id": 568,
			"since": 11,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"notificationMailLanguage": {
			"name": "notificationMailLanguage",
			"id": 418,
			"since": 4,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"sendPlaintextOnly": {
			"name": "sendPlaintextOnly",
			"id": 676,
			"since": 18,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"imapSyncConfig": {
			"name": "imapSyncConfig",
			"id": 222,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ImapSyncConfiguration",
			"final": false
		},
		"inboxRules": {
			"name": "inboxRules",
			"id": 578,
			"since": 12,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InboxRule",
			"final": false
		},
		"lastPushedMail": {
			"name": "lastPushedMail",
			"id": 221,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Mail",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createTutanotaProperties(values?: $Shape<$Exact<TutanotaProperties>>): TutanotaProperties {
	return Object.assign(create(_TypeModel, TutanotaPropertiesTypeRef), values)
}
