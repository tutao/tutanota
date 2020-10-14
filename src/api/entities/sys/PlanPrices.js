// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PlanPricesTypeRef: TypeRef<PlanPrices> = new TypeRef("sys", "PlanPrices")
export const _TypeModel: TypeModel = {
	"name": "PlanPrices",
	"since": 39,
	"type": "AGGREGATED_TYPE",
	"id": 1460,
	"rootId": "A3N5cwAFtA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1461,
			"since": 39,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"additionalUserPriceMonthly": {
			"name": "additionalUserPriceMonthly",
			"id": 1465,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"contactFormPriceMonthly": {
			"name": "contactFormPriceMonthly",
			"id": 1466,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"firstYearDiscount": {
			"name": "firstYearDiscount",
			"id": 1464,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedAliases": {
			"name": "includedAliases",
			"id": 1467,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedStorage": {
			"name": "includedStorage",
			"id": 1468,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monthlyPrice": {
			"name": "monthlyPrice",
			"id": 1463,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monthlyReferencePrice": {
			"name": "monthlyReferencePrice",
			"id": 1462,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPlanPrices(values?: $Shape<$Exact<PlanPrices>>): PlanPrices {
	return Object.assign(create(_TypeModel, PlanPricesTypeRef), values)
}

export type PlanPrices = {
	_type: TypeRef<PlanPrices>;

	_id: Id;
	additionalUserPriceMonthly: NumberString;
	contactFormPriceMonthly: NumberString;
	firstYearDiscount: NumberString;
	includedAliases: NumberString;
	includedStorage: NumberString;
	monthlyPrice: NumberString;
	monthlyReferencePrice: NumberString;
}