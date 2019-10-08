// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
		"_id": {"name": "_id", "id": 858, "since": 24, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"code": {"name": "code", "id": 859, "since": 24, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"footerHtml": {
			"name": "footerHtml",
			"id": 862,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"headerHtml": {
			"name": "headerHtml",
			"id": 861,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"helpHtml": {
			"name": "helpHtml",
			"id": 863,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pageTitle": {
			"name": "pageTitle",
			"id": 860,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"statisticsFields": {
			"name": "statisticsFields",
			"id": 864,
			"since": 24,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InputField",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createContactFormLanguage(values?: $Shape<$Exact<ContactFormLanguage>>): ContactFormLanguage {
	return Object.assign(create(_TypeModel, ContactFormLanguageTypeRef), values)
}
