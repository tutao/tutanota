// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {EmailTemplateContent} from "./EmailTemplateContent"

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
			"refType": "EmailTemplateContent"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createEmailTemplate(values?: $Shape<$Exact<EmailTemplate>>): EmailTemplate {
	return Object.assign(create(_TypeModel, EmailTemplateTypeRef), values)
}

export type EmailTemplate = {
	_type: TypeRef<EmailTemplate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	tag: string;
	title: string;

	contents: EmailTemplateContent[];
}