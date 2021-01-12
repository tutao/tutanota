// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 488,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"application": {
			"id": 489,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"id": {
			"id": 491,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"listId": {
			"id": 492,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"typeId": {
			"id": 490,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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