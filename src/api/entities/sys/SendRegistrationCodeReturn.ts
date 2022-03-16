import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "74"
}

export function createSendRegistrationCodeReturn(values?: Partial<SendRegistrationCodeReturn>): SendRegistrationCodeReturn {
	return Object.assign(create(_TypeModel, SendRegistrationCodeReturnTypeRef), downcast<SendRegistrationCodeReturn>(values))
}

export type SendRegistrationCodeReturn = {
	_type: TypeRef<SendRegistrationCodeReturn>;

	_format: NumberString;
	authToken: string;
}