// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 35,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 33,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 991,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 34,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"approvalStatus": {
			"id": 926,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"businessUse": {
			"id": 1754,
			"type": "Boolean",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"canceledPremiumAccount": {
			"id": 902,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"orderProcessingAgreementNeeded": {
			"id": 1347,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 36,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"auditLog": {
			"id": 1161,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "AuditLogRef"
		},
		"contactFormUserAreaGroups": {
			"id": 1160,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups"
		},
		"contactFormUserGroups": {
			"id": 1159,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups"
		},
		"customizations": {
			"id": 1256,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Feature"
		},
		"rejectedSenders": {
			"id": 1750,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "RejectedSendersRef"
		},
		"userAreaGroups": {
			"id": 992,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups"
		},
		"whitelabelChildren": {
			"id": 1277,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WhitelabelChildrenRef"
		},
		"whitelabelParent": {
			"id": 1276,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WhitelabelParent"
		},
		"adminGroup": {
			"id": 37,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		},
		"adminGroups": {
			"id": 39,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"customerGroup": {
			"id": 38,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		},
		"customerGroups": {
			"id": 40,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"customerInfo": {
			"id": 160,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CustomerInfo"
		},
		"orderProcessingAgreement": {
			"id": 1348,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OrderProcessingAgreement"
		},
		"properties": {
			"id": 662,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CustomerProperties"
		},
		"serverProperties": {
			"id": 960,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CustomerServerProperties"
		},
		"teamGroups": {
			"id": 42,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"userGroups": {
			"id": 41,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "68"
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