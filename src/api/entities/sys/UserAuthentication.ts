import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "RecoverCode",
			"dependency": null
		},
		"secondFactors": {
			"id": 1209,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SecondFactor",
			"dependency": null
		},
		"sessions": {
			"id": 1208,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Session",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserAuthentication(values?: Partial<UserAuthentication>): UserAuthentication {
	return Object.assign(create(_TypeModel, UserAuthenticationTypeRef), downcast<UserAuthentication>(values))
}

export type UserAuthentication = {
	_type: TypeRef<UserAuthentication>;

	_id: Id;

	recoverCode:  null | Id;
	secondFactors: Id;
	sessions: Id;
}