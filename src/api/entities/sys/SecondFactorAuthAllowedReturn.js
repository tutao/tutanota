// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", "SecondFactorAuthAllowedReturn")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthAllowedReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 546,
	"rootId": "A3N5cwACIg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 547,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"allowed": {
			"name": "allowed",
			"id": 548,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createSecondFactorAuthAllowedReturn(): SecondFactorAuthAllowedReturn {
	return create(_TypeModel)
}
