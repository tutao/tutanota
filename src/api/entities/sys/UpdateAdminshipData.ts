import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UpdateAdminshipDataTypeRef: TypeRef<UpdateAdminshipData> = new TypeRef("sys", "UpdateAdminshipData")
export const _TypeModel: TypeModel = {
	"name": "UpdateAdminshipData",
	"since": 27,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1288,
	"rootId": "A3N5cwAFCA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1289,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"newAdminGroupEncGKey": {
			"id": 1290,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 1291,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group",
			"dependency": null
		},
		"newAdminGroup": {
			"id": 1292,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUpdateAdminshipData(values?: Partial<UpdateAdminshipData>): UpdateAdminshipData {
	return Object.assign(create(_TypeModel, UpdateAdminshipDataTypeRef), downcast<UpdateAdminshipData>(values))
}

export type UpdateAdminshipData = {
	_type: TypeRef<UpdateAdminshipData>;

	_format: NumberString;
	newAdminGroupEncGKey: Uint8Array;

	group: Id;
	newAdminGroup: Id;
}