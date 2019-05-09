// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", "SendDraftReturn")
export const _TypeModel: TypeModel = {
	"name": "SendDraftReturn",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 558,
	"rootId": "CHR1dGFub3RhAAIu",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 559, "since": 11, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"messageId": {"name": "messageId", "id": 560, "since": 11, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"sentDate": {"name": "sentDate", "id": 561, "since": 11, "type": "Date", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"notifications": {
			"name": "notifications",
			"id": 562,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationMail",
			"final": false
		},
		"sentMail": {
			"name": "sentMail",
			"id": 563,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createSendDraftReturn(): SendDraftReturn {
	return create(_TypeModel, SendDraftReturnTypeRef)
}
