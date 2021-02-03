// @flow

import {create} from "../../common/utils/EntityUtils"

import type {ContactAddress} from "./ContactAddress"
import type {ContactMailAddress} from "./ContactMailAddress"
import type {Birthday} from "./Birthday"
import type {ContactPhoneNumber} from "./ContactPhoneNumber"
import type {ContactSocialId} from "./ContactSocialId"
import {TypeRef} from "../../common/utils/TypeRef";

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
			"id": 71,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"id": 68,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 66,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"id": 70,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 69,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 585,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 67,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"autoTransmitPassword": {
			"id": 78,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"birthdayIso": {
			"id": 1083,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"comment": {
			"id": 77,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"company": {
			"id": 74,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"firstName": {
			"id": 72,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastName": {
			"id": 73,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"nickname": {
			"id": 849,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"oldBirthdayDate": {
			"id": 76,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"presharedPassword": {
			"id": 79,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"role": {
			"id": 75,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"title": {
			"id": 850,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"addresses": {
			"id": 82,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactAddress"
		},
		"mailAddresses": {
			"id": 80,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactMailAddress"
		},
		"oldBirthdayAggregate": {
			"id": 851,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Birthday"
		},
		"phoneNumbers": {
			"id": 81,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactPhoneNumber"
		},
		"socialIds": {
			"id": 83,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactSocialId"
		},
		"photo": {
			"id": 852,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "File"
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