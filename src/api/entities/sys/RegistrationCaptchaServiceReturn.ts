import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 679,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"challenge": {
			"id": 681,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"token": {
			"id": 680,
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

export function createRegistrationCaptchaServiceReturn(values?: Partial<RegistrationCaptchaServiceReturn>): RegistrationCaptchaServiceReturn {
	return Object.assign(create(_TypeModel, RegistrationCaptchaServiceReturnTypeRef), downcast<RegistrationCaptchaServiceReturn>(values))
}

export type RegistrationCaptchaServiceReturn = {
	_type: TypeRef<RegistrationCaptchaServiceReturn>;

	_format: NumberString;
	challenge: null | Uint8Array;
	token: string;
}