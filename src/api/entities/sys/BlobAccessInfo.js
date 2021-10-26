// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {TargetServer} from "./TargetServer"

export const BlobAccessInfoTypeRef: TypeRef<BlobAccessInfo> = new TypeRef("sys", "BlobAccessInfo")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessInfo",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1892,
	"rootId": "A3N5cwAHZA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1893,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"storageAccessToken": {
			"id": 1894,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"servers": {
			"id": 1895,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "TargetServer",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "69"
}

export function createBlobAccessInfo(values?: $Shape<$Exact<BlobAccessInfo>>): BlobAccessInfo {
	return Object.assign(create(_TypeModel, BlobAccessInfoTypeRef), values)
}

export type BlobAccessInfo = {
	_type: TypeRef<BlobAccessInfo>;

	_id: Id;
	storageAccessToken: string;

	servers: TargetServer[];
}