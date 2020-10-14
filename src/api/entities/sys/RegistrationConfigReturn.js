// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RegistrationConfigReturnTypeRef: TypeRef<RegistrationConfigReturn> = new TypeRef("sys", "RegistrationConfigReturn")
export const _TypeModel: TypeModel = {
	"name": "RegistrationConfigReturn",
	"since": 2,
	"type": "DATA_TRANSFER_TYPE",
	"id": 606,
	"rootId": "A3N5cwACXg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 607,
			"since": 2,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"freeEnabled": {
			"name": "freeEnabled",
			"id": 609,
			"since": 2,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"starterEnabled": {
			"name": "starterEnabled",
			"id": 608,
			"since": 2,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRegistrationConfigReturn(values?: $Shape<$Exact<RegistrationConfigReturn>>): RegistrationConfigReturn {
	return Object.assign(create(_TypeModel, RegistrationConfigReturnTypeRef), values)
}

export type RegistrationConfigReturn = {
	_type: TypeRef<RegistrationConfigReturn>;

	_format: NumberString;
	freeEnabled: boolean;
	starterEnabled: boolean;
}