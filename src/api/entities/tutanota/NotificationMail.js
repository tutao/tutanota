// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", "NotificationMail")
export const _TypeModel: TypeModel = {
	"name": "NotificationMail",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 224,
	"rootId": "CHR1dGFub3RhAADg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 225, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bodyText": {"name": "bodyText", "id": 227, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"mailboxLink": {"name": "mailboxLink", "id": 418, "since": 3, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"recipientMailAddress": {
			"name": "recipientMailAddress",
			"id": 228,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recipientName": {"name": "recipientName", "id": 229, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"subject": {"name": "subject", "id": 226, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createNotificationMail(): NotificationMail {
	return create(_TypeModel, NotificationMailTypeRef)
}
