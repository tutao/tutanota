// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const CustomerInfoReturnTypeRef: TypeRef<CustomerInfoReturn> = new TypeRef("sys", "CustomerInfoReturn")
export const _TypeModel: TypeModel = {
	"name": "CustomerInfoReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 550,
	"rootId": "A3N5cwACJg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 551,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sendMailDisabled": {
			"id": 552,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createCustomerInfoReturn(values?: $Shape<$Exact<CustomerInfoReturn>>): CustomerInfoReturn {
	return Object.assign(create(_TypeModel, CustomerInfoReturnTypeRef), values)
}

export type CustomerInfoReturn = {
	_type: TypeRef<CustomerInfoReturn>;

	_format: NumberString;
	sendMailDisabled: boolean;
}