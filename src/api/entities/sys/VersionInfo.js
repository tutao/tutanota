// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 241,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 239,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1023,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 240,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"app": {
			"name": "app",
			"id": 242,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"operation": {
			"name": "operation",
			"id": 246,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"referenceList": {
			"name": "referenceList",
			"id": 244,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"timestamp": {
			"name": "timestamp",
			"id": 245,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 243,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"versionData": {
			"name": "versionData",
			"id": 247,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"author": {
			"name": "author",
			"id": 248,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		},
		"authorGroupInfo": {
			"name": "authorGroupInfo",
			"id": 249,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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