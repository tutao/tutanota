// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 481,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"operation": {
			"name": "operation",
			"id": 484,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"timestamp": {
			"name": "timestamp",
			"id": 483,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"name": "version",
			"id": 482,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"author": {
			"name": "author",
			"id": 485,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		},
		"authorGroupInfo": {
			"name": "authorGroupInfo",
			"id": 486,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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