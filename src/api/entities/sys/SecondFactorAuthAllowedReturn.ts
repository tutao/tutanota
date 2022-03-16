import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 547,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"allowed": {
			"id": 548,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createSecondFactorAuthAllowedReturn(values?: Partial<SecondFactorAuthAllowedReturn>): SecondFactorAuthAllowedReturn {
	return Object.assign(create(_TypeModel, SecondFactorAuthAllowedReturnTypeRef), downcast<SecondFactorAuthAllowedReturn>(values))
}

export type SecondFactorAuthAllowedReturn = {
	_type: TypeRef<SecondFactorAuthAllowedReturn>;

	_format: NumberString;
	allowed: boolean;
}