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
	"version": "30"
}

export function createUserAuthentication(): UserAuthentication {
	return create(_TypeModel)
}
