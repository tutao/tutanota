// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1518,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"body": {
			"id": 1520,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"id": 1519,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"subject": {
			"id": 1521,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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