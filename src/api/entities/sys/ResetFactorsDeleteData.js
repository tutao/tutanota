// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const ResetFactorsDeleteDataTypeRef: TypeRef<ResetFactorsDeleteData> = new TypeRef("sys", "ResetFactorsDeleteData")
export const _TypeModel: TypeModel = {
	"name": "ResetFactorsDeleteData",
	"since": 36,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1419,
	"rootId": "A3N5cwAFiw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1420,
			"since": 36,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 1422,
			"since": 36,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 1421,
			"since": 36,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1423,
			"since": 36,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createResetFactorsDeleteData(values?: $Shape<$Exact<ResetFactorsDeleteData>>): ResetFactorsDeleteData {
	return Object.assign(create(_TypeModel, ResetFactorsDeleteDataTypeRef), values)
}

export type ResetFactorsDeleteData = {
	_type: TypeRef<ResetFactorsDeleteData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: string;
}