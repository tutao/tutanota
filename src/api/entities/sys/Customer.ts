import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {AuditLogRef} from "./AuditLogRef.js"
import type {UserAreaGroups} from "./UserAreaGroups.js"
import type {Feature} from "./Feature.js"
import type {RejectedSendersRef} from "./RejectedSendersRef.js"
import type {WhitelabelChildrenRef} from "./WhitelabelChildrenRef.js"
import type {WhitelabelParent} from "./WhitelabelParent.js"

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
		"adminGroup": {
			"id": 37,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group",
			"dependency": null
		},
		"adminGroups": {
			"id": 39,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo",
			"dependency": null
		},
		"auditLog": {
			"id": 1161,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "AuditLogRef",
			"dependency": null
		},
		"contactFormUserAreaGroups": {
			"id": 1160,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups",
			"dependency": null
		},
		"contactFormUserGroups": {
			"id": 1159,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups",
			"dependency": null
		},
		"customerGroup": {
			"id": 38,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group",
			"dependency": null
		},
		"customerGroups": {
			"id": 40,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo",
			"dependency": null
		},
		"customerInfo": {
			"id": 160,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CustomerInfo",
			"dependency": null
		},
		"customizations": {
			"id": 1256,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Feature",
			"dependency": null
		},
		"orderProcessingAgreement": {
			"id": 1348,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OrderProcessingAgreement",
			"dependency": null
		},
		"properties": {
			"id": 662,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CustomerProperties",
			"dependency": null
		},
		"rejectedSenders": {
			"id": 1750,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "RejectedSendersRef",
			"dependency": null
		},
		"serverProperties": {
			"id": 960,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CustomerServerProperties",
			"dependency": null
		},
		"teamGroups": {
			"id": 42,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo",
			"dependency": null
		},
		"userAreaGroups": {
			"id": 992,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups",
			"dependency": null
		},
		"userGroups": {
			"id": 41,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo",
			"dependency": null
		},
		"whitelabelChildren": {
			"id": 1277,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WhitelabelChildrenRef",
			"dependency": null
		},
		"whitelabelParent": {
			"id": 1276,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WhitelabelParent",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCustomer(values?: Partial<Customer>): Customer {
	return Object.assign(create(_TypeModel, CustomerTypeRef), downcast<Customer>(values))
}

export type Customer = {
	_type: TypeRef<Customer>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	approvalStatus: NumberString;
	businessUse: null | boolean;
	canceledPremiumAccount: boolean;
	orderProcessingAgreementNeeded: boolean;
	type: NumberString;

	adminGroup: Id;
	adminGroups: Id;
	auditLog:  null | AuditLogRef;
	contactFormUserAreaGroups:  null | UserAreaGroups;
	contactFormUserGroups:  null | UserAreaGroups;
	customerGroup: Id;
	customerGroups: Id;
	customerInfo: IdTuple;
	customizations: Feature[];
	orderProcessingAgreement:  null | IdTuple;
	properties:  null | Id;
	rejectedSenders:  null | RejectedSendersRef;
	serverProperties:  null | Id;
	teamGroups: Id;
	userAreaGroups:  null | UserAreaGroups;
	userGroups: Id;
	whitelabelChildren:  null | WhitelabelChildrenRef;
	whitelabelParent:  null | WhitelabelParent;
}