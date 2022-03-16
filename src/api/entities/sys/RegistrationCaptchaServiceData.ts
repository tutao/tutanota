import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 675,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"response": {
			"id": 677,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"token": {
			"id": 676,
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

export function createRegistrationCaptchaServiceData(values?: Partial<RegistrationCaptchaServiceData>): RegistrationCaptchaServiceData {
	return Object.assign(create(_TypeModel, RegistrationCaptchaServiceDataTypeRef), downcast<RegistrationCaptchaServiceData>(values))
}

export type RegistrationCaptchaServiceData = {
	_type: TypeRef<RegistrationCaptchaServiceData>;

	_format: NumberString;
	response: string;
	token: string;
}