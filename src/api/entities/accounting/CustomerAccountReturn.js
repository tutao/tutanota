// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {CustomerAccountPosting} from "./CustomerAccountPosting"

export const CustomerAccountReturnTypeRef: TypeRef<CustomerAccountReturn> = new TypeRef("accounting", "CustomerAccountReturn")
export const _TypeModel: TypeModel = {
	"name": "CustomerAccountReturn",
	"since": 3,
	"type": "DATA_TRANSFER_TYPE",
	"id": 86,
	"rootId": "CmFjY291bnRpbmcAVg",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 87,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 88,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerPublicEncSessionKey": {
			"id": 89,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"outstandingBookingsPrice": {
			"id": 92,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"postings": {
			"id": 90,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "CustomerAccountPosting",
			"dependency": null
		}
	},
	"app": "accounting",
	"version": "4"
}

export function createCustomerAccountReturn(values?: $Shape<$Exact<CustomerAccountReturn>>): CustomerAccountReturn {
	return Object.assign(create(_TypeModel, CustomerAccountReturnTypeRef), values)
}

export type CustomerAccountReturn = {
	_type: TypeRef<CustomerAccountReturn>;
	_errors: Object;

	_format: NumberString;
	_ownerGroup: ?Id;
	_ownerPublicEncSessionKey: ?Uint8Array;
	outstandingBookingsPrice: NumberString;

	postings: CustomerAccountPosting[];
}