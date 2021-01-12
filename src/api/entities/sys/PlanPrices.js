// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1461,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"additionalUserPriceMonthly": {
			"id": 1465,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"contactFormPriceMonthly": {
			"id": 1466,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"firstYearDiscount": {
			"id": 1464,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedAliases": {
			"id": 1467,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"includedStorage": {
			"id": 1468,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monthlyPrice": {
			"id": 1463,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"monthlyReferencePrice": {
			"id": 1462,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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