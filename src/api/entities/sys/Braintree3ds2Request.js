// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const Braintree3ds2RequestTypeRef: TypeRef<Braintree3ds2Request> = new TypeRef("sys", "Braintree3ds2Request")
export const _TypeModel: TypeModel = {
	"name": "Braintree3ds2Request",
	"since": 66,
	"type": "AGGREGATED_TYPE",
	"id": 1828,
	"rootId": "A3N5cwAHJA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1829,
			"since": 66,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bin": {
			"name": "bin",
			"id": 1832,
			"since": 66,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"clientToken": {
			"name": "clientToken",
			"id": 1830,
			"since": 66,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"nonce": {
			"name": "nonce",
			"id": 1831,
			"since": 66,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "66"
}

export function createBraintree3ds2Request(values?: $Shape<$Exact<Braintree3ds2Request>>): Braintree3ds2Request {
	return Object.assign(create(_TypeModel, Braintree3ds2RequestTypeRef), values)
}

export type Braintree3ds2Request = {
	_type: TypeRef<Braintree3ds2Request>;

	_id: Id;
	bin: string;
	clientToken: string;
	nonce: string;
}