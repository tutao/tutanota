// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {PasswordChannelPhoneNumber} from "./PasswordChannelPhoneNumber"

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
		"_id": {
			"id": 533,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"autoTransmitPassword": {
			"id": 537,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 534,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncBucketKey": {
			"id": 599,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"passwordVerifier": {
			"id": 536,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pwEncCommunicationKey": {
			"id": 540,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"id": 538,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"saltHash": {
			"id": 539,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncBucketKey": {
			"id": 535,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"passwordChannelPhoneNumbers": {
			"id": 541,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "PasswordChannelPhoneNumber"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createSecureExternalRecipientKeyData(values?: $Shape<$Exact<SecureExternalRecipientKeyData>>): SecureExternalRecipientKeyData {
	return Object.assign(create(_TypeModel, SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyData = {
	_type: TypeRef<SecureExternalRecipientKeyData>;

	_id: Id;
	autoTransmitPassword: ?string;
	mailAddress: string;
	ownerEncBucketKey: ?Uint8Array;
	passwordVerifier: Uint8Array;
	pwEncCommunicationKey: ?Uint8Array;
	salt: ?Uint8Array;
	saltHash: ?Uint8Array;
	symEncBucketKey: ?Uint8Array;

	passwordChannelPhoneNumbers: PasswordChannelPhoneNumber[];
}