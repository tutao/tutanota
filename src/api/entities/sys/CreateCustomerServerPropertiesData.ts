import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "72"
}

export function createCreateCustomerServerPropertiesData(values?: Partial<CreateCustomerServerPropertiesData>): CreateCustomerServerPropertiesData {
	return Object.assign(create(_TypeModel, CreateCustomerServerPropertiesDataTypeRef), downcast<CreateCustomerServerPropertiesData>(values))
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
}