// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1226,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"clientData": {
			"name": "clientData",
			"id": 1228,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"name": "keyHandle",
			"id": 1227,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"signatureData": {
			"name": "signatureData",
			"id": 1229,
			"since": 23,
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

export function createU2fResponseData(values?: $Shape<$Exact<U2fResponseData>>): U2fResponseData {
	return Object.assign(create(_TypeModel, U2fResponseDataTypeRef), values)
}

export type U2fResponseData = {
	_type: TypeRef<U2fResponseData>;

	_id: Id;
	clientData: string;
	keyHandle: string;
	signatureData: string;
}