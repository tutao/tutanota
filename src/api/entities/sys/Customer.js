// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
		"canceledPremiumAccount": {
			"name": "canceledPremiumAccount",
			"id": 902,
			"since": 10,
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
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "AuditLogRef",
			"final": true
		},
		"contactFormUserAreaGroups": {
			"name": "contactFormUserAreaGroups",
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"contactFormUserGroups": {
			"name": "contactFormUserGroups",
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"userAreaGroups": {
			"name": "userAreaGroups",
			"since": 17,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"adminGroup": {
			"name": "adminGroup",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"adminGroups": {
			"name": "adminGroups",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"customerGroup": {
			"name": "customerGroup",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"customerGroups": {
			"name": "customerGroups",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"customerInfo": {
			"name": "customerInfo",
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "CustomerInfo",
			"final": true,
			"external": false
		},
		"properties": {
			"name": "properties",
			"since": 6,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "CustomerProperties",
			"final": true,
			"external": false
		},
		"serverProperties": {
			"name": "serverProperties",
			"since": 13,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "CustomerServerProperties",
			"final": true,
			"external": false
		},
		"teamGroups": {
			"name": "teamGroups",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"userGroups": {
			"name": "userGroups",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "23"
}

export function createCustomer(): Customer {
	return create(_TypeModel)
}
