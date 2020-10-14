// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {UserAreaGroups} from "./UserAreaGroups"

export const GroupRootTypeRef: TypeRef<GroupRoot> = new TypeRef("sys", "GroupRoot")
export const _TypeModel: TypeModel = {
	"name": "GroupRoot",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 110,
	"rootId": "A3N5cwBu",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 114,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 112,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 998,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 113,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"externalUserAreaGroupInfos": {
			"name": "externalUserAreaGroupInfos",
			"id": 999,
			"since": 17,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAreaGroups",
			"final": true
		},
		"externalGroupInfos": {
			"name": "externalGroupInfos",
			"id": 116,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"externalUserReferences": {
			"name": "externalUserReferences",
			"id": 117,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "ExternalUserReference",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createGroupRoot(values?: $Shape<$Exact<GroupRoot>>): GroupRoot {
	return Object.assign(create(_TypeModel, GroupRootTypeRef), values)
}

export type GroupRoot = {
	_type: TypeRef<GroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	externalUserAreaGroupInfos: ?UserAreaGroups;
	externalGroupInfos: Id;
	externalUserReferences: Id;
}