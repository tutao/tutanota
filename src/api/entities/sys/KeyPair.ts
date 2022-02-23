import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "72"
}

export function createKeyPair(values?: Partial<KeyPair>): KeyPair {
	return Object.assign(create(_TypeModel, KeyPairTypeRef), downcast<KeyPair>(values))
}

export type KeyPair = {
	_type: TypeRef<KeyPair>;

	_id: Id;
	pubKey: Uint8Array;
	symEncPrivKey: Uint8Array;
	version: NumberString;
}