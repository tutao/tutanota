// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 371,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminUser": {
			"name": "adminUser",
			"id": 372,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		},
		"adminUserGroup": {
			"name": "adminUserGroup",
			"id": 373,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomerReturn(values?: $Shape<$Exact<CustomerReturn>>): CustomerReturn {
	return Object.assign(create(_TypeModel, CustomerReturnTypeRef), values)
}

export type CustomerReturn = {
	_type: TypeRef<CustomerReturn>;

	_format: NumberString;

	adminUser: Id;
	adminUserGroup: Id;
}