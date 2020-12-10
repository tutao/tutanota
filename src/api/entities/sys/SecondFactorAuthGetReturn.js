// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", "SecondFactorAuthGetReturn")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthGetReturn",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1236,
	"rootId": "A3N5cwAE1A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1237,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"secondFactorPending": {
			"name": "secondFactorPending",
			"id": 1238,
			"since": 23,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "65"
}

export function createSecondFactorAuthGetReturn(values?: $Shape<$Exact<SecondFactorAuthGetReturn>>): SecondFactorAuthGetReturn {
	return Object.assign(create(_TypeModel, SecondFactorAuthGetReturnTypeRef), values)
}

export type SecondFactorAuthGetReturn = {
	_type: TypeRef<SecondFactorAuthGetReturn>;

	_format: NumberString;
	secondFactorPending: boolean;
}