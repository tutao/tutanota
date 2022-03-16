import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1343,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerAddress": {
			"id": 1345,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"id": 1344,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createSignOrderProcessingAgreementData(values?: Partial<SignOrderProcessingAgreementData>): SignOrderProcessingAgreementData {
	return Object.assign(create(_TypeModel, SignOrderProcessingAgreementDataTypeRef), downcast<SignOrderProcessingAgreementData>(values))
}

export type SignOrderProcessingAgreementData = {
	_type: TypeRef<SignOrderProcessingAgreementData>;

	_format: NumberString;
	customerAddress: string;
	version: string;
}