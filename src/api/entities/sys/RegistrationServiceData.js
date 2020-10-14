// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RegistrationServiceDataTypeRef: TypeRef<RegistrationServiceData> = new TypeRef("sys", "RegistrationServiceData")
export const _TypeModel: TypeModel = {
	"name": "RegistrationServiceData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 316,
	"rootId": "A3N5cwABPA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 317,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"starterDomain": {
			"name": "starterDomain",
			"id": 322,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"source": {
			"name": "source",
			"id": 874,
			"since": 9,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"state": {
			"name": "state",
			"id": 325,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRegistrationServiceData(values?: $Shape<$Exact<RegistrationServiceData>>): RegistrationServiceData {
	return Object.assign(create(_TypeModel, RegistrationServiceDataTypeRef), values)
}

export type RegistrationServiceData = {
	_type: TypeRef<RegistrationServiceData>;

	_format: NumberString;
	starterDomain: string;
	source: ?string;
	state: NumberString;
}