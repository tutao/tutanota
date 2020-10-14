// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 454,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accessToken": {
			"name": "accessToken",
			"id": 1239,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 456,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"externalAuthToken": {
			"name": "externalAuthToken",
			"id": 968,
			"since": 15,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"name": "userId",
			"id": 455,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAuthentication(values?: $Shape<$Exact<Authentication>>): Authentication {
	return Object.assign(create(_TypeModel, AuthenticationTypeRef), values)
}

export type Authentication = {
	_type: TypeRef<Authentication>;

	_id: Id;
	accessToken: ?string;
	authVerifier: ?string;
	externalAuthToken: ?string;

	userId: Id;
}