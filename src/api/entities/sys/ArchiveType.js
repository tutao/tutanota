// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {ArchiveRef} from "./ArchiveRef"
import type {TypeInfo} from "./TypeInfo"

export const ArchiveTypeTypeRef: TypeRef<ArchiveType> = new TypeRef("sys", "ArchiveType")
export const _TypeModel: TypeModel = {
	"name": "ArchiveType",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1876,
	"rootId": "A3N5cwAHVA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1877,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"active": {
			"id": 1879,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "ArchiveRef",
			"dependency": null
		},
		"inactive": {
			"id": 1880,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ArchiveRef",
			"dependency": null
		},
		"type": {
			"id": 1878,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "TypeInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "69"
}

export function createArchiveType(values?: $Shape<$Exact<ArchiveType>>): ArchiveType {
	return Object.assign(create(_TypeModel, ArchiveTypeTypeRef), values)
}

export type ArchiveType = {
	_type: TypeRef<ArchiveType>;

	_id: Id;

	active: ArchiveRef;
	inactive: ArchiveRef[];
	type: TypeInfo;
}