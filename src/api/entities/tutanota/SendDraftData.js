// @flow

import {create} from "../../common/utils/EntityUtils"

import type {AttachmentKeyData} from "./AttachmentKeyData"
import type {InternalRecipientKeyData} from "./InternalRecipientKeyData"
import type {SecureExternalRecipientKeyData} from "./SecureExternalRecipientKeyData"
import {TypeRef} from "../../common/utils/TypeRef";

export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", "SendDraftData")
export const _TypeModel: TypeModel = {
	"name": "SendDraftData",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 547,
	"rootId": "CHR1dGFub3RhAAIj",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 548,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"bucketEncMailSessionKey": {
			"id": 551,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"calendarMethod": {
			"id": 1117,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"id": 549,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailSessionKey": {
			"id": 550,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"plaintext": {
			"id": 675,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderNameUnencrypted": {
			"id": 552,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"attachmentKeyData": {
			"id": 555,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "AttachmentKeyData"
		},
		"internalRecipientKeyData": {
			"id": 553,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "InternalRecipientKeyData"
		},
		"secureExternalRecipientKeyData": {
			"id": 554,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "SecureExternalRecipientKeyData"
		},
		"mail": {
			"id": 556,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createSendDraftData(values?: $Shape<$Exact<SendDraftData>>): SendDraftData {
	return Object.assign(create(_TypeModel, SendDraftDataTypeRef), values)
}

export type SendDraftData = {
	_type: TypeRef<SendDraftData>;

	_format: NumberString;
	bucketEncMailSessionKey: ?Uint8Array;
	calendarMethod: boolean;
	language: string;
	mailSessionKey: ?Uint8Array;
	plaintext: boolean;
	senderNameUnencrypted: ?string;

	attachmentKeyData: AttachmentKeyData[];
	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	mail: IdTuple;
}