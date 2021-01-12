// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "68"
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