// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const OrderProcessingAgreementsTypeRef: TypeRef<OrderProcessingAgreements> = new TypeRef("sys", "OrderProcessingAgreements")
export const _TypeModel: TypeModel = {
	"name": "OrderProcessingAgreements",
	"since": 31,
	"type": "AGGREGATED_TYPE",
	"id": 1338,
	"rootId": "A3N5cwAFOg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1339,
			"since": 31,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"agreements": {
			"name": "agreements",
			"id": 1340,
			"since": 31,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "OrderProcessingAgreement",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createOrderProcessingAgreements(): OrderProcessingAgreements {
	return create(_TypeModel)
}
