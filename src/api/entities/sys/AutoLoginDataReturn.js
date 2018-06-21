// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", "AutoLoginDataReturn")
export const _TypeModel: TypeModel = {
	"name": "AutoLoginDataReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 438,
	"rootId": "A3N5cwABtg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 439,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"deviceKey": {
			"name": "deviceKey",
			"id": 440,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createAutoLoginDataReturn(): AutoLoginDataReturn {
	return create(_TypeModel)
}
