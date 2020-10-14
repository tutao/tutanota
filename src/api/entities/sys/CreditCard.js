// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CreditCardTypeRef: TypeRef<CreditCard> = new TypeRef("sys", "CreditCard")
export const _TypeModel: TypeModel = {
	"name": "CreditCard",
	"since": 30,
	"type": "AGGREGATED_TYPE",
	"id": 1313,
	"rootId": "A3N5cwAFIQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1314,
			"since": 30,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"cardHolderName": {
			"name": "cardHolderName",
			"id": 1315,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"cvv": {
			"name": "cvv",
			"id": 1317,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"expirationMonth": {
			"name": "expirationMonth",
			"id": 1318,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"expirationYear": {
			"name": "expirationYear",
			"id": 1319,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"number": {
			"name": "number",
			"id": 1316,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createCreditCard(values?: $Shape<$Exact<CreditCard>>): CreditCard {
	return Object.assign(create(_TypeModel, CreditCardTypeRef), values)
}

export type CreditCard = {
	_type: TypeRef<CreditCard>;

	_id: Id;
	cardHolderName: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
	number: string;
}