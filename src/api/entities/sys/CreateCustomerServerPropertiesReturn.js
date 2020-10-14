// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", "CreateCustomerServerPropertiesReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateCustomerServerPropertiesReturn",
	"since": 13,
	"type": "DATA_TRANSFER_TYPE",
	"id": 964,
	"rootId": "A3N5cwADxA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 965,
			"since": 13,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"id": {
			"name": "id",
			"id": 966,
			"since": 13,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "CustomerServerProperties",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCreateCustomerServerPropertiesReturn(values?: $Shape<$Exact<CreateCustomerServerPropertiesReturn>>): CreateCustomerServerPropertiesReturn {
	return Object.assign(create(_TypeModel, CreateCustomerServerPropertiesReturnTypeRef), values)
}

export type CreateCustomerServerPropertiesReturn = {
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;

	_format: NumberString;

	id: Id;
}