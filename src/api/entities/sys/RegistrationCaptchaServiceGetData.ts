import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const RegistrationCaptchaServiceGetDataTypeRef: TypeRef<RegistrationCaptchaServiceGetData> = new TypeRef("sys", "RegistrationCaptchaServiceGetData")
export const _TypeModel: TypeModel = {
	"name": "RegistrationCaptchaServiceGetData",
	"since": 40,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1479,
	"rootId": "A3N5cwAFxw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1480,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"businessUseSelected": {
			"id": 1752,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1482,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"paidSubscriptionSelected": {
			"id": 1751,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"signupToken": {
			"id": 1731,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"token": {
			"id": 1481,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createRegistrationCaptchaServiceGetData(values?: Partial<RegistrationCaptchaServiceGetData>): RegistrationCaptchaServiceGetData {
	return Object.assign(create(_TypeModel, RegistrationCaptchaServiceGetDataTypeRef), downcast<RegistrationCaptchaServiceGetData>(values))
}

export type RegistrationCaptchaServiceGetData = {
	_type: TypeRef<RegistrationCaptchaServiceGetData>;

	_format: NumberString;
	businessUseSelected: boolean;
	mailAddress: string;
	paidSubscriptionSelected: boolean;
	signupToken: null | string;
	token: null | string;
}