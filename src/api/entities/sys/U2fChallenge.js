// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {U2fKey} from "./U2fKey"

export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", "U2fChallenge")
export const _TypeModel: TypeModel = {
	"name": "U2fChallenge",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1183,
	"rootId": "A3N5cwAEnw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1184,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"challenge": {
			"id": 1185,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"keys": {
			"id": 1186,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "U2fKey"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createU2fChallenge(values?: $Shape<$Exact<U2fChallenge>>): U2fChallenge {
	return Object.assign(create(_TypeModel, U2fChallengeTypeRef), values)
}

export type U2fChallenge = {
	_type: TypeRef<U2fChallenge>;

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}