// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const SignOrderProcessingAgreementDataTypeRef: TypeRef<SignOrderProcessingAgreementData> = new TypeRef("sys", "SignOrderProcessingAgreementData")
export const _TypeModel: TypeModel = {
	"name": "SignOrderProcessingAgreementData",
	"since": 31,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1342,
	"rootId": "A3N5cwAFPg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1343,
			"since": 31,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerAddress": {
			"name": "customerAddress",
			"id": 1345,
			"since": 31,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"name": "version",
			"id": 1344,
			"since": 31,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createSignOrderProcessingAgreementData(values?: $Shape<$Exact<SignOrderProcessingAgreementData>>): SignOrderProcessingAgreementData {
	return Object.assign(create(_TypeModel, SignOrderProcessingAgreementDataTypeRef), values)
}

export type SignOrderProcessingAgreementData = {
	_type: TypeRef<SignOrderProcessingAgreementData>;

	_format: NumberString;
	customerAddress: string;
	version: string;
}