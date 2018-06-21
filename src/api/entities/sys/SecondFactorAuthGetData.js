// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", "SecondFactorAuthGetData")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthGetData",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1233,
	"rootId": "A3N5cwAE0Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1234,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessToken": {
			"name": "accessToken",
			"id": 1235,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createSecondFactorAuthGetData(): SecondFactorAuthGetData {
	return create(_TypeModel)
}
