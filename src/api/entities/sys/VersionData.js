// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const VersionDataTypeRef: TypeRef<VersionData> = new TypeRef("sys", "VersionData")
export const _TypeModel: TypeModel = {
	"name": "VersionData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 487,
	"rootId": "A3N5cwAB5w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 488,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"application": {
			"name": "application",
			"id": 489,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"id": {
			"name": "id",
			"id": 491,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"listId": {
			"name": "listId",
			"id": 492,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"typeId": {
			"name": "typeId",
			"id": 490,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createVersionData(values?: $Shape<$Exact<VersionData>>): VersionData {
	return Object.assign(create(_TypeModel, VersionDataTypeRef), values)
}

export type VersionData = {
	_type: TypeRef<VersionData>;

	_format: NumberString;
	application: string;
	id: Id;
	listId: ?Id;
	typeId: NumberString;
}