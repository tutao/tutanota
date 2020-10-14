// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RegistrationCaptchaServiceDataTypeRef: TypeRef<RegistrationCaptchaServiceData> = new TypeRef("sys", "RegistrationCaptchaServiceData")
export const _TypeModel: TypeModel = {
	"name": "RegistrationCaptchaServiceData",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 674,
	"rootId": "A3N5cwACog",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 675,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"response": {
			"name": "response",
			"id": 677,
			"since": 7,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"token": {
			"name": "token",
			"id": 676,
			"since": 7,
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

export function createRegistrationCaptchaServiceData(values?: $Shape<$Exact<RegistrationCaptchaServiceData>>): RegistrationCaptchaServiceData {
	return Object.assign(create(_TypeModel, RegistrationCaptchaServiceDataTypeRef), values)
}

export type RegistrationCaptchaServiceData = {
	_type: TypeRef<RegistrationCaptchaServiceData>;

	_format: NumberString;
	response: string;
	token: string;
}