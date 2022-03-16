import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
		"source": {
			"id": 874,
			"type": "String",
			"cardinality": "ZeroOrOne",
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
	"version": "74"
}

export function createRegistrationServiceData(values?: Partial<RegistrationServiceData>): RegistrationServiceData {
	return Object.assign(create(_TypeModel, RegistrationServiceDataTypeRef), downcast<RegistrationServiceData>(values))
}

export type RegistrationServiceData = {
	_type: TypeRef<RegistrationServiceData>;

	_format: NumberString;
	source: null | string;
	starterDomain: string;
	state: NumberString;
}