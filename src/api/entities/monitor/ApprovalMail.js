// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ApprovalMailTypeRef: TypeRef<ApprovalMail> = new TypeRef("monitor", "ApprovalMail")
export const _TypeModel: TypeModel = {
	"name": "ApprovalMail",
	"since": 14,
	"type": "LIST_ELEMENT_TYPE",
	"id": 221,
	"rootId": "B21vbml0b3IAAN0",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 225,
			"since": 14,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 223,
			"since": 14,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 226,
			"since": 14,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 224,
			"since": 14,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 228,
			"since": 14,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"range": {
			"name": "range",
			"id": 227,
			"since": 14,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"text": {
			"name": "text",
			"id": 229,
			"since": 14,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 230,
			"since": 14,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": true,
			"external": true
		}
	},
	"app": "monitor",
	"version": "14"
}

export function createApprovalMail(values?: $Shape<$Exact<ApprovalMail>>): ApprovalMail {
	return Object.assign(create(_TypeModel, ApprovalMailTypeRef), values)
}
