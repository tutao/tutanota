// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", "OtpChallenge")
export const _TypeModel: TypeModel = {
	"name": "OtpChallenge",
	"since": 24,
	"type": "AGGREGATED_TYPE",
	"id": 1244,
	"rootId": "A3N5cwAE3A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1245,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"secondFactors": {
			"id": 1246,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "SecondFactor"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createOtpChallenge(values?: $Shape<$Exact<OtpChallenge>>): OtpChallenge {
	return Object.assign(create(_TypeModel, OtpChallengeTypeRef), values)
}

export type OtpChallenge = {
	_type: TypeRef<OtpChallenge>;

	_id: Id;

	secondFactors: IdTuple[];
}