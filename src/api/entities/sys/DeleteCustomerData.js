// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 642,
			"since": 5,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 1325,
			"since": 30,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"reason": {
			"name": "reason",
			"id": 644,
			"since": 5,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"takeoverMailAddress": {
			"name": "takeoverMailAddress",
			"id": 1077,
			"since": 19,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"undelete": {
			"name": "undelete",
			"id": 643,
			"since": 5,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 645,
			"since": 5,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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