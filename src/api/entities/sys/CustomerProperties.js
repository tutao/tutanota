// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {File} from "./File"
import type {NotificationMailTemplate} from "./NotificationMailTemplate"

export const CustomerPropertiesTypeRef: TypeRef<CustomerProperties> = new TypeRef("sys", "CustomerProperties")
export const _TypeModel: TypeModel = {
	"name": "CustomerProperties",
	"since": 6,
	"type": "ELEMENT_TYPE",
	"id": 656,
	"rootId": "A3N5cwACkA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 660,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 658,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 985,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 659,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"externalUserWelcomeMessage": {
			"name": "externalUserWelcomeMessage",
			"id": 661,
			"since": 6,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastUpgradeReminder": {
			"name": "lastUpgradeReminder",
			"id": 975,
			"since": 15,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bigLogo": {
			"name": "bigLogo",
			"id": 923,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false
		},
		"notificationMailTemplates": {
			"name": "notificationMailTemplates",
			"id": 1522,
			"since": 45,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationMailTemplate",
			"final": false
		},
		"smallLogo": {
			"name": "smallLogo",
			"id": 922,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomerProperties(values?: $Shape<$Exact<CustomerProperties>>): CustomerProperties {
	return Object.assign(create(_TypeModel, CustomerPropertiesTypeRef), values)
}

export type CustomerProperties = {
	_type: TypeRef<CustomerProperties>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	externalUserWelcomeMessage: string;
	lastUpgradeReminder: ?Date;

	bigLogo: ?File;
	notificationMailTemplates: NotificationMailTemplate[];
	smallLogo: ?File;
}