// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const TargetServerTypeRef: TypeRef<TargetServer> = new TypeRef("sys", "TargetServer")
export const _TypeModel: TypeModel = {
	"name": "TargetServer",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1889,
	"rootId": "A3N5cwAHYQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1890,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"url": {
			"id": 1891,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createTargetServer(values?: $Shape<$Exact<TargetServer>>): TargetServer {
	return Object.assign(create(_TypeModel, TargetServerTypeRef), values)
}

export type TargetServer = {
	_type: TypeRef<TargetServer>;

	_id: Id;
	url: string;
}