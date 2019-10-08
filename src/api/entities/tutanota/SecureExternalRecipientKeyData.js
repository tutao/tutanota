// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", "SecureExternalRecipientKeyData")
export const _TypeModel: TypeModel = {
	"name": "SecureExternalRecipientKeyData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 532,
	"rootId": "CHR1dGFub3RhAAIU",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 533, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"autoTransmitPassword": {
			"name": "autoTransmitPassword",
			"id": 537,
			"since": 11,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 534,
			"since": 11,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncBucketKey": {
			"name": "ownerEncBucketKey",
			"id": 599,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"passwordVerifier": {
			"name": "passwordVerifier",
			"id": 536,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pwEncCommunicationKey": {
			"name": "pwEncCommunicationKey",
			"id": 540,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"salt": {"name": "salt", "id": 538, "since": 11, "type": "Bytes", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"saltHash": {
			"name": "saltHash",
			"id": 539,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncBucketKey": {
			"name": "symEncBucketKey",
			"id": 535,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"passwordChannelPhoneNumbers": {
			"name": "passwordChannelPhoneNumbers",
			"id": 541,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "PasswordChannelPhoneNumber",
			"final": true
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createSecureExternalRecipientKeyData(values?: $Shape<$Exact<SecureExternalRecipientKeyData>>): SecureExternalRecipientKeyData {
	return Object.assign(create(_TypeModel, SecureExternalRecipientKeyDataTypeRef), values)
}
