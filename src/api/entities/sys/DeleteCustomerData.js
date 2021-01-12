// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", "DeleteCustomerData")
export const _TypeModel: TypeModel = {
	"name": "DeleteCustomerData",
	"since": 5,
	"type": "DATA_TRANSFER_TYPE",
	"id": 641,
	"rootId": "A3N5cwACgQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 642,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"id": 1325,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"reason": {
			"id": 644,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"takeoverMailAddress": {
			"id": 1077,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"undelete": {
			"id": 643,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"id": 645,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Customer"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createDeleteCustomerData(values?: $Shape<$Exact<DeleteCustomerData>>): DeleteCustomerData {
	return Object.assign(create(_TypeModel, DeleteCustomerDataTypeRef), values)
}

export type DeleteCustomerData = {
	_type: TypeRef<DeleteCustomerData>;

	_format: NumberString;
	authVerifier: ?Uint8Array;
	reason: string;
	takeoverMailAddress: ?string;
	undelete: boolean;

	customer: Id;
}