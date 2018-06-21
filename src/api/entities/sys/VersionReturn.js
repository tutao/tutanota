// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 494,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"versions": {
			"name": "versions",
			"id": 495,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Version",
			"final": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createVersionReturn(): VersionReturn {
	return create(_TypeModel)
}
