// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const ContactFormLanguageTypeRef: TypeRef<ContactFormLanguage> = new TypeRef("tutanota", "ContactFormLanguage")
export const _TypeModel: TypeModel = {
	"name": "ContactFormLanguage",
	"since": 24,
	"type": "AGGREGATED_TYPE",
	"id": 857,
	"rootId": "CHR1dGFub3RhAANZ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 858,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"code": {
			"id": 859,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"footerHtml": {
			"id": 862,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"headerHtml": {
			"id": 861,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"helpHtml": {
			"id": 863,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pageTitle": {
			"id": 860,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createContactFormLanguage(values?: $Shape<$Exact<ContactFormLanguage>>): ContactFormLanguage {
	return Object.assign(create(_TypeModel, ContactFormLanguageTypeRef), values)
}

export type ContactFormLanguage = {
	_type: TypeRef<ContactFormLanguage>;

	_id: Id;
	code: string;
	footerHtml: string;
	headerHtml: string;
	helpHtml: string;
	pageTitle: string;
}