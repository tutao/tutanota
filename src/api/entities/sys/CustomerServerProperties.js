// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {EmailSenderListElement} from "./EmailSenderListElement"
import type {StringWrapper} from "./StringWrapper"
import type {DomainsRef} from "./DomainsRef"

export const CustomerServerPropertiesTypeRef: TypeRef<CustomerServerProperties> = new TypeRef("sys", "CustomerServerProperties")
export const _TypeModel: TypeModel = {
	"name": "CustomerServerProperties",
	"since": 13,
	"type": "ELEMENT_TYPE",
	"id": 954,
	"rootId": "A3N5cwADug",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 958,
			"since": 13,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 956,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 987,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 986,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 957,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"requirePasswordUpdateAfterReset": {
			"name": "requirePasswordUpdateAfterReset",
			"id": 1100,
			"since": 22,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"saveEncryptedIpAddressInSession": {
			"name": "saveEncryptedIpAddressInSession",
			"id": 1406,
			"since": 35,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"whitelabelCode": {
			"name": "whitelabelCode",
			"id": 1278,
			"since": 26,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"emailSenderList": {
			"name": "emailSenderList",
			"id": 959,
			"since": 13,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EmailSenderListElement",
			"final": false
		},
		"whitelabelRegistrationDomains": {
			"name": "whitelabelRegistrationDomains",
			"id": 1279,
			"since": 26,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "StringWrapper",
			"final": false
		},
		"whitelistedDomains": {
			"name": "whitelistedDomains",
			"id": 1099,
			"since": 21,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "DomainsRef",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomerServerProperties(values?: $Shape<$Exact<CustomerServerProperties>>): CustomerServerProperties {
	return Object.assign(create(_TypeModel, CustomerServerPropertiesTypeRef), values)
}

export type CustomerServerProperties = {
	_type: TypeRef<CustomerServerProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;
	whitelabelCode: string;

	emailSenderList: EmailSenderListElement[];
	whitelabelRegistrationDomains: StringWrapper[];
	whitelistedDomains: ?DomainsRef;
}