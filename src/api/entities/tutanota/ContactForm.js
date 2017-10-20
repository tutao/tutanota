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
		"_id": {
			"name": "_id",
			"id": 735,
			"since": 19,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
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
		"footerHtml": {
			"name": "footerHtml",
			"id": 742,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"headerHtml": {
			"name": "headerHtml",
			"id": 741,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"helpHtml": {
			"name": "helpHtml",
			"id": 743,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pageTitle": {
			"name": "pageTitle",
			"id": 740,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"path": {
			"name": "path",
			"id": 739,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"statisticsFields": {
			"name": "statisticsFields",
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InputField",
			"final": false
		},
		"delegationGroups_removed": {
			"name": "delegationGroups_removed",
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Group",
			"final": false,
			"external": true
		},
		"participantGroupInfos": {
			"name": "participantGroupInfos",
			"since": 21,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "GroupInfo",
			"final": false,
			"external": true
		},
		"targetGroupInfo": {
			"name": "targetGroupInfo",
			"since": 21,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "GroupInfo",
			"final": false,
			"external": true
		},
		"targetMailGroup_removed": {
			"name": "targetMailGroup_removed",
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "23"
}

export function createContactForm(): ContactForm {
	return create(_TypeModel)
}
