import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {EntityUpdate} from "./EntityUpdate.js"

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
			"id": 1083,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1081,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1084,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1082,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"events": {
			"id": 1085,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "EntityUpdate",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createEntityEventBatch(values?: Partial<EntityEventBatch>): EntityEventBatch {
	return Object.assign(create(_TypeModel, EntityEventBatchTypeRef), downcast<EntityEventBatch>(values))
}

export type EntityEventBatch = {
	_type: TypeRef<EntityEventBatch>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	events: EntityUpdate[];
}