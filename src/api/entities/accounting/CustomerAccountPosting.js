// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CustomerAccountPostingTypeRef: TypeRef<CustomerAccountPosting> = new TypeRef("accounting", "CustomerAccountPosting")
export const _TypeModel: TypeModel = {
	"name": "CustomerAccountPosting",
	"since": 3,
	"type": "AGGREGATED_TYPE",
	"id": 79,
	"rootId": "CmFjY291bnRpbmcATw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 80,
			"since": 3,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"amount": {
			"name": "amount",
			"id": 84,
			"since": 3,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"balance": {
			"name": "balance",
			"id": 85,
			"since": 3,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"invoiceNumber": {
			"name": "invoiceNumber",
			"id": 83,
			"since": 3,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"type": {
			"name": "type",
			"id": 81,
			"since": 3,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"valueDate": {
			"name": "valueDate",
			"id": 82,
			"since": 3,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "accounting",
	"version": "3"
}

export function createCustomerAccountPosting(values?: $Shape<$Exact<CustomerAccountPosting>>): CustomerAccountPosting {
	return Object.assign(create(_TypeModel, CustomerAccountPostingTypeRef), values)
}
