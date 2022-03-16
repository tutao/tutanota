import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", "VerifyRegistrationCodeData")
export const _TypeModel: TypeModel = {
	"name": "VerifyRegistrationCodeData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 351,
	"rootId": "A3N5cwABXw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 352,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 353,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"id": 354,
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

export function createVerifyRegistrationCodeData(values?: Partial<VerifyRegistrationCodeData>): VerifyRegistrationCodeData {
	return Object.assign(create(_TypeModel, VerifyRegistrationCodeDataTypeRef), downcast<VerifyRegistrationCodeData>(values))
}

export type VerifyRegistrationCodeData = {
	_type: TypeRef<VerifyRegistrationCodeData>;

	_format: NumberString;
	authToken: string;
	code: string;
}