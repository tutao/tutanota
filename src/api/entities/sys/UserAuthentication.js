// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1207,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"recoverCode": {
			"id": 1416,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "RecoverCode"
		},
		"secondFactors": {
			"id": 1209,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SecondFactor"
		},
		"sessions": {
			"id": 1208,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Session"
		}
	},
	"app": "sys",
	"version": "69"
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