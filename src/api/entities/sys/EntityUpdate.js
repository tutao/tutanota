// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const EntityUpdateTypeRef: TypeRef<EntityUpdate> = new TypeRef("sys", "EntityUpdate")
export const _TypeModel: TypeModel = {
	"name": "EntityUpdate",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 462,
	"rootId": "A3N5cwABzg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 463,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"application": {
			"name": "application",
			"id": 464,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceId": {
			"name": "instanceId",
			"id": 467,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"name": "instanceListId",
			"id": 466,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"operation": {
			"name": "operation",
			"id": 624,
			"since": 4,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 465,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createEntityUpdate(values?: $Shape<$Exact<EntityUpdate>>): EntityUpdate {
	return Object.assign(create(_TypeModel, EntityUpdateTypeRef), values)
}

export type EntityUpdate = {
	_type: TypeRef<EntityUpdate>;

	_id: Id;
	application: string;
	instanceId: string;
	instanceListId: string;
	operation: NumberString;
	type: string;
}