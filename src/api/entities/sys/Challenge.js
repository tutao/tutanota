// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", "Challenge")
export const _TypeModel: TypeModel = {
	"name": "Challenge",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1185,
	"rootId": "A3N5cwAEoQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1186,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1187,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"u2f": {
			"name": "u2f",
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "U2fChallenge",
			"final": true
		}
	},
	"app": "sys",
	"version": "23"
}

export function createChallenge(): Challenge {
	return create(_TypeModel)
}
