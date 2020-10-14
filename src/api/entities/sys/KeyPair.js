// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubKey": {
			"name": "pubKey",
			"id": 2,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symEncPrivKey": {
			"name": "symEncPrivKey",
			"id": 3,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"version": {
			"name": "version",
			"id": 4,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
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