// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 317,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"starterDomain": {
			"id": 322,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"source": {
			"id": 874,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"state": {
			"id": 325,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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