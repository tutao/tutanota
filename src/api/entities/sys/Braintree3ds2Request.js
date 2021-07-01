// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1829,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bin": {
			"id": 1832,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"clientToken": {
			"id": 1830,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"nonce": {
			"id": 1831,
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