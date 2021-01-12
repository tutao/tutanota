// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 958,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 956,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 987,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 986,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 957,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"requirePasswordUpdateAfterReset": {
			"id": 1100,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"saveEncryptedIpAddressInSession": {
			"id": 1406,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"whitelabelCode": {
			"id": 1278,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"emailSenderList": {
			"id": 959,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "EmailSenderListElement"
		},
		"whitelabelRegistrationDomains": {
			"id": 1279,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "StringWrapper"
		},
		"whitelistedDomains": {
			"id": 1099,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "DomainsRef"
		}
	},
	"app": "sys",
	"version": "68"
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