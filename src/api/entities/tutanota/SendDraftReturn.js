// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {NotificationMail} from "./NotificationMail"

export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", "SendDraftReturn")
export const _TypeModel: TypeModel = {
	"name": "SendDraftReturn",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 557,
	"rootId": "CHR1dGFub3RhAAIt",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 558,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"messageId": {
			"id": 559,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sentDate": {
			"id": 560,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"notifications": {
			"id": 561,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "NotificationMail"
		},
		"sentMail": {
			"id": 562,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createSendDraftReturn(values?: $Shape<$Exact<SendDraftReturn>>): SendDraftReturn {
	return Object.assign(create(_TypeModel, SendDraftReturnTypeRef), values)
}

export type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;

	_format: NumberString;
	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
}