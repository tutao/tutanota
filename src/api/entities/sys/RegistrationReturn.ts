import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", "RegistrationReturn")
export const _TypeModel: TypeModel = {
	"name": "RegistrationReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 326,
	"rootId": "A3N5cwABRg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 327,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"id": 328,
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

export function createRegistrationReturn(values?: Partial<RegistrationReturn>): RegistrationReturn {
	return Object.assign(create(_TypeModel, RegistrationReturnTypeRef), downcast<RegistrationReturn>(values))
}

export type RegistrationReturn = {
	_type: TypeRef<RegistrationReturn>;

	_format: NumberString;
	authToken: string;
}