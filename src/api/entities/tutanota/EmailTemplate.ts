import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {EmailTemplateContent} from "./EmailTemplateContent.js"

export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", "EmailTemplate")
export const _TypeModel: TypeModel = {
	"name": "EmailTemplate",
	"since": 45,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1158,
	"rootId": "CHR1dGFub3RhAASG",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1162,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1160,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1164,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1163,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1161,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"tag": {
			"id": 1166,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"title": {
			"id": 1165,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"contents": {
			"id": 1167,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "EmailTemplateContent",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createEmailTemplate(values?: Partial<EmailTemplate>): EmailTemplate {
	return Object.assign(create(_TypeModel, EmailTemplateTypeRef), downcast<EmailTemplate>(values))
}

export type EmailTemplate = {
	_type: TypeRef<EmailTemplate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	tag: string;
	title: string;

	contents: EmailTemplateContent[];
}