import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 965,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"id": {
			"id": 966,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "CustomerServerProperties",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCreateCustomerServerPropertiesReturn(values?: Partial<CreateCustomerServerPropertiesReturn>): CreateCustomerServerPropertiesReturn {
	return Object.assign(create(_TypeModel, CreateCustomerServerPropertiesReturnTypeRef), downcast<CreateCustomerServerPropertiesReturn>(values))
}

export type CreateCustomerServerPropertiesReturn = {
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;

	_format: NumberString;

	id: Id;
}