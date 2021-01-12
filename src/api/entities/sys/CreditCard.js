// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1314,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"cardHolderName": {
			"id": 1315,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"cvv": {
			"id": 1317,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"expirationMonth": {
			"id": 1318,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"expirationYear": {
			"id": 1319,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"number": {
			"id": 1316,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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