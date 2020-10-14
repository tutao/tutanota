// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const UserAuthenticationTypeRef: TypeRef<UserAuthentication> = new TypeRef("sys", "UserAuthentication")
export const _TypeModel: TypeModel = {
	"name": "UserAuthentication",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1206,
	"rootId": "A3N5cwAEtg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1207,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"recoverCode": {
			"name": "recoverCode",
			"id": 1416,
			"since": 36,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "RecoverCode",
			"final": false,
			"external": false
		},
		"secondFactors": {
			"name": "secondFactors",
			"id": 1209,
			"since": 23,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "SecondFactor",
			"final": true,
			"external": false
		},
		"sessions": {
			"name": "sessions",
			"id": 1208,
			"since": 23,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Session",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUserAuthentication(values?: $Shape<$Exact<UserAuthentication>>): UserAuthentication {
	return Object.assign(create(_TypeModel, UserAuthenticationTypeRef), values)
}

export type UserAuthentication = {
	_type: TypeRef<UserAuthentication>;

	_id: Id;

	recoverCode: ?Id;
	secondFactors: Id;
	sessions: Id;
}