// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", "CreateCustomerServerPropertiesData")
export const _TypeModel: TypeModel = {
	"name": "CreateCustomerServerPropertiesData",
	"since": 13,
	"type": "DATA_TRANSFER_TYPE",
	"id": 961,
	"rootId": "A3N5cwADwQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 962,
			"since": 13,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminGroupEncSessionKey": {
			"name": "adminGroupEncSessionKey",
			"id": 963,
			"since": 13,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createCreateCustomerServerPropertiesData(values?: $Shape<$Exact<CreateCustomerServerPropertiesData>>): CreateCustomerServerPropertiesData {
	return Object.assign(create(_TypeModel, CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
}