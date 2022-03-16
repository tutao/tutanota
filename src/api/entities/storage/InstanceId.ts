import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const InstanceIdTypeRef: TypeRef<InstanceId> = new TypeRef("storage", "InstanceId")
export const _TypeModel: TypeModel = {
	"name": "InstanceId",
	"since": 4,
	"type": "AGGREGATED_TYPE",
	"id": 165,
	"rootId": "B3N0b3JhZ2UAAKU",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 166,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"instanceId": {
			"id": 167,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "storage",
	"version": "4"
}

export function createInstanceId(values?: Partial<InstanceId>): InstanceId {
	return Object.assign(create(_TypeModel, InstanceIdTypeRef), downcast<InstanceId>(values))
}

export type InstanceId = {
	_type: TypeRef<InstanceId>;

	_id: Id;
	instanceId: null | Id;
}