import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const U2fResponseDataTypeRef: TypeRef<U2fResponseData> = new TypeRef("sys", "U2fResponseData")
export const _TypeModel: TypeModel = {
	"name": "U2fResponseData",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1225,
	"rootId": "A3N5cwAEyQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1226,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"clientData": {
			"id": 1228,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"id": 1227,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"signatureData": {
			"id": 1229,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createU2fResponseData(values?: Partial<U2fResponseData>): U2fResponseData {
	return Object.assign(create(_TypeModel, U2fResponseDataTypeRef), downcast<U2fResponseData>(values))
}

export type U2fResponseData = {
	_type: TypeRef<U2fResponseData>;

	_id: Id;
	clientData: string;
	keyHandle: string;
	signatureData: string;
}