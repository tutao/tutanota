import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1420,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"id": 1422,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1421,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"id": 1423,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createResetFactorsDeleteData(values?: Partial<ResetFactorsDeleteData>): ResetFactorsDeleteData {
	return Object.assign(create(_TypeModel, ResetFactorsDeleteDataTypeRef), downcast<ResetFactorsDeleteData>(values))
}

export type ResetFactorsDeleteData = {
	_type: TypeRef<ResetFactorsDeleteData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: string;
}