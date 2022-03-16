import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {OtpChallenge} from "./OtpChallenge.js"
import type {U2fChallenge} from "./U2fChallenge.js"

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
			"refType": "OtpChallenge",
			"dependency": null
		},
		"u2f": {
			"id": 1190,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "U2fChallenge",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createChallenge(values?: Partial<Challenge>): Challenge {
	return Object.assign(create(_TypeModel, ChallengeTypeRef), downcast<Challenge>(values))
}

export type Challenge = {
	_type: TypeRef<Challenge>;

	_id: Id;
	type: NumberString;

	otp:  null | OtpChallenge;
	u2f:  null | U2fChallenge;
}