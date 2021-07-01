// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "69"
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