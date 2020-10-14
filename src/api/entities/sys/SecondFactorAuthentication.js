// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const SecondFactorAuthenticationTypeRef: TypeRef<SecondFactorAuthentication> = new TypeRef("sys", "SecondFactorAuthentication")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthentication",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 54,
	"rootId": "A3N5cwA2",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 58,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 56,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 994,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 57,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"code": {
			"name": "code",
			"id": 59,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"finished": {
			"name": "finished",
			"id": 61,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"service": {
			"name": "service",
			"id": 62,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifyCount": {
			"name": "verifyCount",
			"id": 60,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createSecondFactorAuthentication(values?: $Shape<$Exact<SecondFactorAuthentication>>): SecondFactorAuthentication {
	return Object.assign(create(_TypeModel, SecondFactorAuthenticationTypeRef), values)
}

export type SecondFactorAuthentication = {
	_type: TypeRef<SecondFactorAuthentication>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	code: string;
	finished: boolean;
	service: string;
	verifyCount: NumberString;
}