// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 962,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"adminGroupEncSessionKey": {
			"id": 963,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createCreateCustomerServerPropertiesData(values?: $Shape<$Exact<CreateCustomerServerPropertiesData>>): CreateCustomerServerPropertiesData {
	return Object.assign(create(_TypeModel, CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
}