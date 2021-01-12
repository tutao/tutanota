// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const VersionTypeRef: TypeRef<Version> = new TypeRef("sys", "Version")
export const _TypeModel: TypeModel = {
	"name": "Version",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 480,
	"rootId": "A3N5cwAB4A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 481,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"operation": {
			"id": 484,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"timestamp": {
			"id": 483,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"id": 482,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"author": {
			"id": 485,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		},
		"authorGroupInfo": {
			"id": 486,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createVersion(values?: $Shape<$Exact<Version>>): Version {
	return Object.assign(create(_TypeModel, VersionTypeRef), values)
}

export type Version = {
	_type: TypeRef<Version>;

	_id: Id;
	operation: string;
	timestamp: Date;
	version: Id;

	author: Id;
	authorGroupInfo: IdTuple;
}