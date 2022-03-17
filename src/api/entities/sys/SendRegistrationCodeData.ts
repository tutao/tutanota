import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const SendRegistrationCodeDataTypeRef: TypeRef<SendRegistrationCodeData> = new TypeRef("sys", "SendRegistrationCodeData")
export const _TypeModel: TypeModel = {
	"name": "SendRegistrationCodeData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 341,
	"rootId": "A3N5cwABVQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 342,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"id": 345,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 343,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"id": 344,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mobilePhoneNumber": {
			"id": 346,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createSendRegistrationCodeData(values?: Partial<SendRegistrationCodeData>): SendRegistrationCodeData {
	return Object.assign(create(_TypeModel, SendRegistrationCodeDataTypeRef), downcast<SendRegistrationCodeData>(values))
}

export type SendRegistrationCodeData = {
	_type: TypeRef<SendRegistrationCodeData>;

	_format: NumberString;
	accountType: NumberString;
	authToken: string;
	language: string;
	mobilePhoneNumber: string;
}