// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", "EmailTemplateContent")
export const _TypeModel: TypeModel = {
	"name": "EmailTemplateContent",
	"since": 45,
	"type": "AGGREGATED_TYPE",
	"id": 1154,
	"rootId": "CHR1dGFub3RhAASC",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1155,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"languageCode": {
			"id": 1157,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"text": {
			"id": 1156,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createEmailTemplateContent(values?: $Shape<$Exact<EmailTemplateContent>>): EmailTemplateContent {
	return Object.assign(create(_TypeModel, EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;

	_id: Id;
	languageCode: string;
	text: string;
}