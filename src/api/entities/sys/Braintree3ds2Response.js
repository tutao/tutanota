// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const Braintree3ds2ResponseTypeRef: TypeRef<Braintree3ds2Response> = new TypeRef("sys", "Braintree3ds2Response")
export const _TypeModel: TypeModel = {
	"name": "Braintree3ds2Response",
	"since": 66,
	"type": "AGGREGATED_TYPE",
	"id": 1833,
	"rootId": "A3N5cwAHKQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1834,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"clientToken": {
			"id": 1835,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"nonce": {
			"id": 1836,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createBraintree3ds2Response(values?: $Shape<$Exact<Braintree3ds2Response>>): Braintree3ds2Response {
	return Object.assign(create(_TypeModel, Braintree3ds2ResponseTypeRef), values)
}

export type Braintree3ds2Response = {
	_type: TypeRef<Braintree3ds2Response>;

	_id: Id;
	clientToken: string;
	nonce: string;
}