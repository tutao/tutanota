import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", "UserExternalAuthInfo")
export const _TypeModel: TypeModel = {
	"name": "UserExternalAuthInfo",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 77,
	"rootId": "A3N5cwBN",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 78,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authUpdateCounter": {
			"id": 82,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"id": 79,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"autoTransmitPassword": {
			"id": 81,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"latestSaltHash": {
			"id": 80,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"variableAuthInfo": {
			"id": 83,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "VariableExternalAuthInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserExternalAuthInfo(values?: Partial<UserExternalAuthInfo>): UserExternalAuthInfo {
	return Object.assign(create(_TypeModel, UserExternalAuthInfoTypeRef), downcast<UserExternalAuthInfo>(values))
}

export type UserExternalAuthInfo = {
	_type: TypeRef<UserExternalAuthInfo>;

	_id: Id;
	authUpdateCounter: NumberString;
	autoAuthenticationId: Id;
	autoTransmitPassword: null | string;
	latestSaltHash: null | Uint8Array;

	variableAuthInfo: Id;
}