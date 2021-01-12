// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 114,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 112,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 998,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 113,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"externalUserAreaGroupInfos": {
			"id": 999,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UserAreaGroups"
		},
		"externalGroupInfos": {
			"id": 116,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"externalUserReferences": {
			"id": 117,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "ExternalUserReference"
		}
	},
	"app": "sys",
	"version": "68"
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