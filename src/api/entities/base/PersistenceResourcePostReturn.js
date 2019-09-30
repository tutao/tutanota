// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", "PersistenceResourcePostReturn")
export const _TypeModel: TypeModel = {
	"name": "PersistenceResourcePostReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 0,
	"rootId": "BGJhc2UAAA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"generatedId": {
			"name": "generatedId",
			"id": 2,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"permissionListId": {
			"name": "permissionListId",
			"id": 3,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "base",
	"version": "1"
}

export function createPersistenceResourcePostReturn(values?: $Shape<$Exact<PersistenceResourcePostReturn>>): PersistenceResourcePostReturn {
	return Object.assign(create(_TypeModel, PersistenceResourcePostReturnTypeRef), values)
}
