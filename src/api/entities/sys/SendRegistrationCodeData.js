// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 342,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 345,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 343,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"name": "language",
			"id": 344,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mobilePhoneNumber": {
			"name": "mobilePhoneNumber",
			"id": 346,
			"since": 1,
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

export function createSendRegistrationCodeData(values?: $Shape<$Exact<SendRegistrationCodeData>>): SendRegistrationCodeData {
	return Object.assign(create(_TypeModel, SendRegistrationCodeDataTypeRef), values)
}

export type SendRegistrationCodeData = {
	_type: TypeRef<SendRegistrationCodeData>;

	_format: NumberString;
	accountType: NumberString;
	authToken: string;
	language: string;
	mobilePhoneNumber: string;
}