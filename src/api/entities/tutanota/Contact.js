// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {ContactAddress} from "./ContactAddress"
import type {ContactMailAddress} from "./ContactMailAddress"
import type {Birthday} from "./Birthday"
import type {ContactPhoneNumber} from "./ContactPhoneNumber"
import type {ContactSocialId} from "./ContactSocialId"

export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", "Contact")
export const _TypeModel: TypeModel = {
	"name": "Contact",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 64,
	"rootId": "CHR1dGFub3RhAEA",
	"versioned": true,
	"encrypted": true,
	"values": {
		"_area": {
			"name": "_area",
			"id": 71,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"name": "_format",
			"id": 68,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 66,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"name": "_owner",
			"id": 70,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 69,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 585,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 67,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"autoTransmitPassword": {
			"name": "autoTransmitPassword",
			"id": 78,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"birthdayIso": {
			"name": "birthdayIso",
			"id": 1083,
			"since": 41,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"comment": {
			"name": "comment",
			"id": 77,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"company": {
			"name": "company",
			"id": 74,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"firstName": {
			"name": "firstName",
			"id": 72,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastName": {
			"name": "lastName",
			"id": 73,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"nickname": {
			"name": "nickname",
			"id": 849,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"oldBirthdayDate": {
			"name": "oldBirthdayDate",
			"id": 76,
			"since": 1,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"presharedPassword": {
			"name": "presharedPassword",
			"id": 79,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"role": {
			"name": "role",
			"id": 75,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"title": {
			"name": "title",
			"id": 850,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"addresses": {
			"name": "addresses",
			"id": 82,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactAddress",
			"final": false
		},
		"mailAddresses": {
			"name": "mailAddresses",
			"id": 80,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactMailAddress",
			"final": false
		},
		"oldBirthdayAggregate": {
			"name": "oldBirthdayAggregate",
			"id": 851,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Birthday",
			"final": false
		},
		"phoneNumbers": {
			"name": "phoneNumbers",
			"id": 81,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactPhoneNumber",
			"final": false
		},
		"socialIds": {
			"name": "socialIds",
			"id": 83,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactSocialId",
			"final": false
		},
		"photo": {
			"name": "photo",
			"id": 852,
			"since": 23,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createContact(values?: $Shape<$Exact<Contact>>): Contact {
	return Object.assign(create(_TypeModel, ContactTypeRef), values)
}

export type Contact = {
	_type: TypeRef<Contact>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	autoTransmitPassword: string;
	birthdayIso: ?string;
	comment: string;
	company: string;
	firstName: string;
	lastName: string;
	nickname: ?string;
	oldBirthdayDate: ?Date;
	presharedPassword: ?string;
	role: string;
	title: ?string;

	addresses: ContactAddress[];
	mailAddresses: ContactMailAddress[];
	oldBirthdayAggregate: ?Birthday;
	phoneNumbers: ContactPhoneNumber[];
	socialIds: ContactSocialId[];
	photo: ?IdTuple;
}