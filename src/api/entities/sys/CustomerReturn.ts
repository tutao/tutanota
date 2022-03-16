import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const CustomerReturnTypeRef: TypeRef<CustomerReturn> = new TypeRef("sys", "CustomerReturn")
export const _TypeModel: TypeModel = {
	"name": "CustomerReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 370,
	"rootId": "A3N5cwABcg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 371,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminUser": {
			"id": 372,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User",
			"dependency": null
		},
		"adminUserGroup": {
			"id": 373,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCustomerReturn(values?: Partial<CustomerReturn>): CustomerReturn {
	return Object.assign(create(_TypeModel, CustomerReturnTypeRef), downcast<CustomerReturn>(values))
}

export type CustomerReturn = {
	_type: TypeRef<CustomerReturn>;

	_format: NumberString;

	adminUser: Id;
	adminUserGroup: Id;
}