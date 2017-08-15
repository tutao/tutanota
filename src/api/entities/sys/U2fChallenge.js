// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", "U2fChallenge")
export const _TypeModel: TypeModel = {
	"name": "U2fChallenge",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1181,
	"rootId": "A3N5cwAEnQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1182,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"challenge": {
			"name": "challenge",
			"id": 1183,
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
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "U2fKey",
			"final": true
		}
	},
	"app": "sys",
	"version": "23"
}

export function createU2fChallenge(): U2fChallenge {
	return create(_TypeModel)
}
