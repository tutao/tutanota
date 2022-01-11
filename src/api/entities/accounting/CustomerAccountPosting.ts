import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 80,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"amount": {
			"id": 84,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"balance": {
			"id": 85,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"invoiceNumber": {
			"id": 83,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"type": {
			"id": 81,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"valueDate": {
			"id": 82,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "accounting",
	"version": "4"
}

export function createCustomerAccountPosting(values?: Partial<CustomerAccountPosting>): CustomerAccountPosting {
	return Object.assign(create(_TypeModel, CustomerAccountPostingTypeRef), downcast<CustomerAccountPosting>(values))
}

export type CustomerAccountPosting = {
	_type: TypeRef<CustomerAccountPosting>;

	_id: Id;
	amount: NumberString;
	balance: NumberString;
	invoiceNumber: null | string;
	type: NumberString;
	valueDate: Date;
}