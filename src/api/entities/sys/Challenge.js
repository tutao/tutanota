// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {OtpChallenge} from "./OtpChallenge"
import type {U2fChallenge} from "./U2fChallenge"

export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", "Challenge")
export const _TypeModel: TypeModel = {
	"name": "Challenge",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1187,
	"rootId": "A3N5cwAEow",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1188,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1189,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"otp": {
			"name": "otp",
			"id": 1247,
			"since": 24,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "OtpChallenge",
			"final": true
		},
		"u2f": {
			"name": "u2f",
			"id": 1190,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "U2fChallenge",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
}

export function createChallenge(values?: $Shape<$Exact<Challenge>>): Challenge {
	return Object.assign(create(_TypeModel, ChallengeTypeRef), values)
}

export type Challenge = {
	_type: TypeRef<Challenge>;

	_id: Id;
	type: NumberString;

	otp: ?OtpChallenge;
	u2f: ?U2fChallenge;
}