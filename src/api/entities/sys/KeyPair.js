// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", "KeyPair")
export const _TypeModel: TypeModel = {
	"name": "KeyPair",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 0,
	"rootId": "A3N5cwAA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubKey": {
			"id": 2,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symEncPrivKey": {
			"id": 3,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"version": {
			"id": 4,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createKeyPair(values?: $Shape<$Exact<KeyPair>>): KeyPair {
	return Object.assign(create(_TypeModel, KeyPairTypeRef), values)
}

export type KeyPair = {
	_type: TypeRef<KeyPair>;

	_id: Id;
	pubKey: Uint8Array;
	symEncPrivKey: Uint8Array;
	version: NumberString;
}