import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {U2fKey} from "./U2fKey.js"

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
			"refType": "U2fKey",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createU2fChallenge(values?: Partial<U2fChallenge>): U2fChallenge {
	return Object.assign(create(_TypeModel, U2fChallengeTypeRef), downcast<U2fChallenge>(values))
}

export type U2fChallenge = {
	_type: TypeRef<U2fChallenge>;

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}