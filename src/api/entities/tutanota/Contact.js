// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", "Contact")
export const _TypeModel: TypeModel = {
	"name": "Contact",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 65,
	"rootId": "CHR1dGFub3RhAEE",
	"versioned": true,
	"encrypted": true,
	"values": {
		"_area": {"name": "_area", "id": 72, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"_format": {"name": "_format", "id": 69, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 67, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_owner": {"name": "_owner", "id": 71, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 70,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 586, "since": 13, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 68, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"autoTransmitPassword": {
			"name": "autoTransmitPassword",
			"id": 79,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"comment": {"name": "comment", "id": 78, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"company": {"name": "company", "id": 75, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"firstName": {"name": "firstName", "id": 73, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"lastName": {"name": "lastName", "id": 74, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"nickname": {"name": "nickname", "id": 850, "since": 23, "type": "String", "cardinality": "ZeroOrOne", "final": false, "encrypted": true},
		"oldBirthday": {"name": "oldBirthday", "id": 77, "since": 1, "type": "Date", "cardinality": "ZeroOrOne", "final": false, "encrypted": true},
		"presharedPassword": {
			"name": "presharedPassword",
			"id": 80,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"role": {"name": "role", "id": 76, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"title": {"name": "title", "id": 851, "since": 23, "type": "String", "cardinality": "ZeroOrOne", "final": false, "encrypted": true}
	},
	"associations": {
		"addresses": {
			"name": "addresses",
			"id": 83,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactAddress",
			"final": false
		},
		"birthday": {"name": "birthday", "id": 852, "since": 23, "type": "AGGREGATION", "cardinality": "ZeroOrOne", "refType": "Birthday", "final": false},
		"mailAddresses": {
			"name": "mailAddresses",
			"id": 81,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactMailAddress",
			"final": false
		},
		"phoneNumbers": {
			"name": "phoneNumbers",
			"id": 82,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactPhoneNumber",
			"final": false
		},
		"socialIds": {"name": "socialIds", "id": 84, "since": 1, "type": "AGGREGATION", "cardinality": "Any", "refType": "ContactSocialId", "final": false},
		"photo": {
			"name": "photo",
			"id": 853,
			"since": 23,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createContact(): Contact {
	return create(_TypeModel, ContactTypeRef)
}
