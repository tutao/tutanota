// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormTypeRef: TypeRef<ContactForm> = new TypeRef("tutanota", "ContactForm")
export const _TypeModel: TypeModel = {
	"name": "ContactForm",
	"since": 19,
	"type": "LIST_ELEMENT_TYPE",
	"id": 733,
	"rootId": "CHR1dGFub3RhAALd",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 737,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 735, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 738,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 736,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"path": {"name": "path", "id": 739, "since": 19, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"languages": {
			"name": "languages",
			"id": 865,
			"since": 24,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormLanguage",
			"final": false
		},
		"statisticsFields_removed": {
			"name": "statisticsFields_removed",
			"id": 745,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InputField",
			"final": false
		},
		"statisticsLog": {
			"name": "statisticsLog",
			"id": 878,
			"since": 25,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "StatisticLogRef",
			"final": true
		},
		"delegationGroups_removed": {
			"name": "delegationGroups_removed",
			"id": 747,
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Group",
			"final": false,
			"external": true
		},
		"participantGroupInfos": {
			"name": "participantGroupInfos",
			"id": 822,
			"since": 21,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "GroupInfo",
			"final": false,
			"external": true
		},
		"targetGroup": {
			"name": "targetGroup",
			"id": 746,
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": true
		},
		"targetGroupInfo": {
			"name": "targetGroupInfo",
			"id": 821,
			"since": 21,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "GroupInfo",
			"final": false,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createContactForm(values?: $Shape<$Exact<ContactForm>>): ContactForm {
	return Object.assign(create(_TypeModel, ContactFormTypeRef), values)
}
