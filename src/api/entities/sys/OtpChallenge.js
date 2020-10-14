// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1245,
			"since": 24,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"secondFactors": {
			"name": "secondFactors",
			"id": 1246,
			"since": 24,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "SecondFactor",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createOtpChallenge(values?: $Shape<$Exact<OtpChallenge>>): OtpChallenge {
	return Object.assign(create(_TypeModel, OtpChallengeTypeRef), values)
}

export type OtpChallenge = {
	_type: TypeRef<OtpChallenge>;

	_id: Id;

	secondFactors: IdTuple[];
}