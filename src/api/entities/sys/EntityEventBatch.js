// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {EntityUpdate} from "./EntityUpdate"

export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", "EntityEventBatch")
export const _TypeModel: TypeModel = {
	"name": "EntityEventBatch",
	"since": 20,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1079,
	"rootId": "A3N5cwAENw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1083,
			"since": 20,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1081,
			"since": 20,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1084,
			"since": 20,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1082,
			"since": 20,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"events": {
			"name": "events",
			"id": 1085,
			"since": 20,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EntityUpdate",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
}

export function createEntityEventBatch(values?: $Shape<$Exact<EntityEventBatch>>): EntityEventBatch {
	return Object.assign(create(_TypeModel, EntityEventBatchTypeRef), values)
}

export type EntityEventBatch = {
	_type: TypeRef<EntityEventBatch>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;

	events: EntityUpdate[];
}