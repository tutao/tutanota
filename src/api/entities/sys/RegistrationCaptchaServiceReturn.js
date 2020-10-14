// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", "RegistrationCaptchaServiceReturn")
export const _TypeModel: TypeModel = {
	"name": "RegistrationCaptchaServiceReturn",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 678,
	"rootId": "A3N5cwACpg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 679,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"challenge": {
			"name": "challenge",
			"id": 681,
			"since": 7,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"token": {
			"name": "token",
			"id": 680,
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

export function createRegistrationCaptchaServiceReturn(values?: $Shape<$Exact<RegistrationCaptchaServiceReturn>>): RegistrationCaptchaServiceReturn {
	return Object.assign(create(_TypeModel, RegistrationCaptchaServiceReturnTypeRef), values)
}

export type RegistrationCaptchaServiceReturn = {
	_type: TypeRef<RegistrationCaptchaServiceReturn>;

	_format: NumberString;
	challenge: ?Uint8Array;
	token: string;
}