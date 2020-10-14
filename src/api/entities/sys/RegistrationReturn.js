// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 327,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 328,
			"since": 1,
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

export function createRegistrationReturn(values?: $Shape<$Exact<RegistrationReturn>>): RegistrationReturn {
	return Object.assign(create(_TypeModel, RegistrationReturnTypeRef), values)
}

export type RegistrationReturn = {
	_type: TypeRef<RegistrationReturn>;

	_format: NumberString;
	authToken: string;
}