// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 463,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"application": {
			"id": 464,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceId": {
			"id": 467,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 466,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"operation": {
			"id": 624,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 465,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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