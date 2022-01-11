import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 58,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 56,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 994,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 57,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"code": {
			"id": 59,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"finished": {
			"id": 61,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"service": {
			"id": 62,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifyCount": {
			"id": 60,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createSecondFactorAuthentication(values?: Partial<SecondFactorAuthentication>): SecondFactorAuthentication {
	return Object.assign(create(_TypeModel, SecondFactorAuthenticationTypeRef), downcast<SecondFactorAuthentication>(values))
}

export type SecondFactorAuthentication = {
	_type: TypeRef<SecondFactorAuthentication>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	code: string;
	finished: boolean;
	service: string;
	verifyCount: NumberString;
}