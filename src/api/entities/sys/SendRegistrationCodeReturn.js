// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", "SendRegistrationCodeReturn")
export const _TypeModel: TypeModel = {
	"name": "SendRegistrationCodeReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 347,
	"rootId": "A3N5cwABWw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 348,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 349,
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

export function createSendRegistrationCodeReturn(values?: $Shape<$Exact<SendRegistrationCodeReturn>>): SendRegistrationCodeReturn {
	return Object.assign(create(_TypeModel, SendRegistrationCodeReturnTypeRef), values)
}

export type SendRegistrationCodeReturn = {
	_type: TypeRef<SendRegistrationCodeReturn>;

	_format: NumberString;
	authToken: string;
}