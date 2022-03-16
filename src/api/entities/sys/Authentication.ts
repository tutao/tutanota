import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const AuthenticationTypeRef: TypeRef<Authentication> = new TypeRef("sys", "Authentication")
export const _TypeModel: TypeModel = {
	"name": "Authentication",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 453,
	"rootId": "A3N5cwABxQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 454,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accessToken": {
			"id": 1239,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authVerifier": {
			"id": 456,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"externalAuthToken": {
			"id": 968,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"id": 455,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createAuthentication(values?: Partial<Authentication>): Authentication {
	return Object.assign(create(_TypeModel, AuthenticationTypeRef), downcast<Authentication>(values))
}

export type Authentication = {
	_type: TypeRef<Authentication>;

	_id: Id;
	accessToken: null | string;
	authVerifier: null | string;
	externalAuthToken: null | string;

	userId: Id;
}