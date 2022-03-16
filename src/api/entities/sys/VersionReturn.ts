import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Version} from "./Version.js"

export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", "VersionReturn")
export const _TypeModel: TypeModel = {
	"name": "VersionReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 493,
	"rootId": "A3N5cwAB7Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 494,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"versions": {
			"id": 495,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Version",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createVersionReturn(values?: Partial<VersionReturn>): VersionReturn {
	return Object.assign(create(_TypeModel, VersionReturnTypeRef), downcast<VersionReturn>(values))
}

export type VersionReturn = {
	_type: TypeRef<VersionReturn>;

	_format: NumberString;

	versions: Version[];
}