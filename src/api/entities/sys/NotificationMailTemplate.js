// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const NotificationMailTemplateTypeRef: TypeRef<NotificationMailTemplate> = new TypeRef("sys", "NotificationMailTemplate")
export const _TypeModel: TypeModel = {
	"name": "NotificationMailTemplate",
	"since": 45,
	"type": "AGGREGATED_TYPE",
	"id": 1517,
	"rootId": "A3N5cwAF7Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1518,
			"since": 45,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"body": {
			"name": "body",
			"id": 1520,
			"since": 45,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"name": "language",
			"id": 1519,
			"since": 45,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"subject": {
			"name": "subject",
			"id": 1521,
			"since": 45,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createNotificationMailTemplate(values?: $Shape<$Exact<NotificationMailTemplate>>): NotificationMailTemplate {
	return Object.assign(create(_TypeModel, NotificationMailTemplateTypeRef), values)
}

export type NotificationMailTemplate = {
	_type: TypeRef<NotificationMailTemplate>;

	_id: Id;
	body: string;
	language: string;
	subject: string;
}