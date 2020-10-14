// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {AuditLogRef} from "./AuditLogRef"
import type {UserAreaGroups} from "./UserAreaGroups"
import type {Feature} from "./Feature"
import type {RejectedSendersRef} from "./RejectedSendersRef"
import type {WhitelabelChildrenRef} from "./WhitelabelChildrenRef"
import type {WhitelabelParent} from "./WhitelabelParent"

export const CustomerTypeRef: TypeRef<Customer> = new TypeRef("sys", "Customer")
export const _TypeModel: TypeModel = {
	"name": "Customer",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 31,
	"rootId": "A3N5cwAf",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 35,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 33,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 991,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 34,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"approvalStatus": {
			"name": "approvalStatus",
			"id": 926,
			"since": 12,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"businessUse": {
			"name": "businessUse",
			"id": 1754,
			"since": 61,
			"type": "Boolean",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"canceledPremiumAccount": {
			"name": "canceledPremiumAccount",
			"id": 902,
			"since": 10,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"orderProcessingAgreementNeeded": {
			"name": "orderProcessingAgreementNeeded",
			"id": 1347,
			"since": 31,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 36,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"auditLog": {
			"name": "auditLog",
			"id": 1161,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "AuditLogRef",
			"final": true
		},
		"contactFormUserAreaGroups": {
			"name": "contactFormUserAreaGroups",
			"id": 1160,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"contactFormUserGroups": {
			"name": "contactFormUserGroups",
			"id": 1159,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"customizations": {
			"name": "customizations",
			"id": 1256,
			"since": 25,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Feature",
			"final": false
		},
		"rejectedSenders": {
			"name": "rejectedSenders",
			"id": 1750,
			"since": 60,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "RejectedSendersRef",
			"final": true
		},
		"userAreaGroups": {
			"name": "userAreaGroups",
			"id": 992,
			"since": 17,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"whitelabelChildren": {
			"name": "whitelabelChildren",
			"id": 1277,
			"since": 26,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "WhitelabelChildrenRef",
			"final": true
		},
		"whitelabelParent": {
			"name": "whitelabelParent",
			"id": 1276,
			"since": 26,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "WhitelabelParent",
			"final": true
		},
		"adminGroup": {
			"name": "adminGroup",
			"id": 37,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"adminGroups": {
			"name": "adminGroups",
			"id": 39,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"customerGroup": {
			"name": "customerGroup",
			"id": 38,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"customerGroups": {
			"name": "customerGroups",
			"id": 40,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"customerInfo": {
			"name": "customerInfo",
			"id": 160,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "CustomerInfo",
			"final": true,
			"external": false
		},
		"orderProcessingAgreement": {
			"name": "orderProcessingAgreement",
			"id": 1348,
			"since": 31,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "OrderProcessingAgreement",
			"final": true,
			"external": false
		},
		"properties": {
			"name": "properties",
			"id": 662,
			"since": 6,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "CustomerProperties",
			"final": true,
			"external": false
		},
		"serverProperties": {
			"name": "serverProperties",
			"id": 960,
			"since": 13,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "CustomerServerProperties",
			"final": true,
			"external": false
		},
		"teamGroups": {
			"name": "teamGroups",
			"id": 42,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"userGroups": {
			"name": "userGroups",
			"id": 41,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomer(values?: $Shape<$Exact<Customer>>): Customer {
	return Object.assign(create(_TypeModel, CustomerTypeRef), values)
}

export type Customer = {
	_type: TypeRef<Customer>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	approvalStatus: NumberString;
	businessUse: ?boolean;
	canceledPremiumAccount: boolean;
	orderProcessingAgreementNeeded: boolean;
	type: NumberString;

	auditLog: ?AuditLogRef;
	contactFormUserAreaGroups: ?UserAreaGroups;
	contactFormUserGroups: ?UserAreaGroups;
	customizations: Feature[];
	rejectedSenders: ?RejectedSendersRef;
	userAreaGroups: ?UserAreaGroups;
	whitelabelChildren: ?WhitelabelChildrenRef;
	whitelabelParent: ?WhitelabelParent;
	adminGroup: Id;
	adminGroups: Id;
	customerGroup: Id;
	customerGroups: Id;
	customerInfo: IdTuple;
	orderProcessingAgreement: ?IdTuple;
	properties: ?Id;
	serverProperties: ?Id;
	teamGroups: Id;
	userGroups: Id;
}