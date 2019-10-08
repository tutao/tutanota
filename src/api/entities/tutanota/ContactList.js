// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", "ContactList")
export const _TypeModel: TypeModel = {
	"name": "ContactList",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 153,
	"rootId": "CHR1dGFub3RhAACZ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 157,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 155, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 593,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 592,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 156,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"photos": {
			"name": "photos",
			"id": 856,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PhotosRef",
			"final": false
		},
		"contacts": {
			"name": "contacts",
			"id": 160,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Contact",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createContactList(values?: $Shape<$Exact<ContactList>>): ContactList {
	return Object.assign(create(_TypeModel, ContactListTypeRef), values)
}
