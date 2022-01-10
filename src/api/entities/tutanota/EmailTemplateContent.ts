import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "49"
}

export function createEmailTemplateContent(values?: Partial<EmailTemplateContent>): EmailTemplateContent {
	return Object.assign(create(_TypeModel, EmailTemplateContentTypeRef), downcast<EmailTemplateContent>(values))
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;

	_id: Id;
	languageCode: string;
	text: string;
}