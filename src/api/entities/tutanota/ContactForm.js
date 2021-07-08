// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {ContactFormLanguage} from "./ContactFormLanguage"

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
			"id": 737,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 735,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 738,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 736,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"path": {
			"id": 739,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"languages": {
			"id": 865,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactFormLanguage"
		},
		"delegationGroups_removed": {
			"id": 747,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Group"
		},
		"participantGroupInfos": {
			"id": 822,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "GroupInfo"
		},
		"targetGroup": {
			"id": 746,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		},
		"targetGroupInfo": {
			"id": 821,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "GroupInfo"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createContactForm(values?: $Shape<$Exact<ContactForm>>): ContactForm {
	return Object.assign(create(_TypeModel, ContactFormTypeRef), values)
}

export type ContactForm = {
	_type: TypeRef<ContactForm>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	path: string;

	languages: ContactFormLanguage[];
	delegationGroups_removed: Id[];
	participantGroupInfos: IdTuple[];
	targetGroup: Id;
	targetGroupInfo: ?IdTuple;
}