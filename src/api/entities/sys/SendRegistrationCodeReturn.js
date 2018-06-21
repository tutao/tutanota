// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 348,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 349,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createSendRegistrationCodeReturn(): SendRegistrationCodeReturn {
	return create(_TypeModel)
}
