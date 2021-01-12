// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1188,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1189,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"otp": {
			"id": 1247,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OtpChallenge"
		},
		"u2f": {
			"id": 1190,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "U2fChallenge"
		}
	},
	"app": "sys",
	"version": "68"
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