// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const VersionInfoTypeRef: TypeRef<VersionInfo> = new TypeRef("sys", "VersionInfo")
export const _TypeModel: TypeModel = {
	"name": "VersionInfo",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 237,
	"rootId": "A3N5cwAA7Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 241,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 239,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1023,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 240,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"app": {
			"id": 242,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"operation": {
			"id": 246,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"referenceList": {
			"id": 244,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"timestamp": {
			"id": 245,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 243,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"versionData": {
			"id": 247,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"author": {
			"id": 248,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		},
		"authorGroupInfo": {
			"id": 249,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createVersionInfo(values?: $Shape<$Exact<VersionInfo>>): VersionInfo {
	return Object.assign(create(_TypeModel, VersionInfoTypeRef), values)
}

export type VersionInfo = {
	_type: TypeRef<VersionInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	app: string;
	operation: string;
	referenceList: ?Id;
	timestamp: Date;
	type: NumberString;
	versionData: ?Uint8Array;

	author: Id;
	authorGroupInfo: IdTuple;
}