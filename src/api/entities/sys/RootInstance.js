// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RootInstanceTypeRef: TypeRef<RootInstance> = new TypeRef("sys", "RootInstance")
export const _TypeModel: TypeModel = {
	"name": "RootInstance",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 231,
	"rootId": "A3N5cwAA5w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 235,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 233,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1022,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 234,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"reference": {
			"name": "reference",
			"id": 236,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRootInstance(values?: $Shape<$Exact<RootInstance>>): RootInstance {
	return Object.assign(create(_TypeModel, RootInstanceTypeRef), values)
}

export type RootInstance = {
	_type: TypeRef<RootInstance>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	reference: Id;
}