// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 1184,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"challenge": {
			"name": "challenge",
			"id": 1185,
			"since": 23,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"keys": {
			"name": "keys",
			"id": 1186,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "U2fKey",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
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