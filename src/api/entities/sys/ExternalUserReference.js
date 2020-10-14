// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const ExternalUserReferenceTypeRef: TypeRef<ExternalUserReference> = new TypeRef("sys", "ExternalUserReference")
export const _TypeModel: TypeModel = {
	"name": "ExternalUserReference",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 103,
	"rootId": "A3N5cwBn",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 107,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 105,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 997,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 106,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"id": 108,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		},
		"userGroup": {
			"name": "userGroup",
			"id": 109,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createExternalUserReference(values?: $Shape<$Exact<ExternalUserReference>>): ExternalUserReference {
	return Object.assign(create(_TypeModel, ExternalUserReferenceTypeRef), values)
}

export type ExternalUserReference = {
	_type: TypeRef<ExternalUserReference>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;

	user: Id;
	userGroup: Id;
}