// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", "NotificationMail")
export const _TypeModel: TypeModel = {
	"name": "NotificationMail",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 223,
	"rootId": "CHR1dGFub3RhAADf",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 224, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bodyText": {"name": "bodyText", "id": 226, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"mailboxLink": {
			"name": "mailboxLink",
			"id": 417,
			"since": 3,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recipientMailAddress": {
			"name": "recipientMailAddress",
			"id": 227,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recipientName": {
			"name": "recipientName",
			"id": 228,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"subject": {"name": "subject", "id": 225, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createNotificationMail(values?: $Shape<$Exact<NotificationMail>>): NotificationMail {
	return Object.assign(create(_TypeModel, NotificationMailTypeRef), values)
}
