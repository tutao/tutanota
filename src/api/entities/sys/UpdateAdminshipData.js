// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1289,
			"since": 27,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"newAdminGroupEncGKey": {
			"name": "newAdminGroupEncGKey",
			"id": 1290,
			"since": 27,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 1291,
			"since": 27,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"newAdminGroup": {
			"name": "newAdminGroup",
			"id": 1292,
			"since": 27,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUpdateAdminshipData(values?: $Shape<$Exact<UpdateAdminshipData>>): UpdateAdminshipData {
	return Object.assign(create(_TypeModel, UpdateAdminshipDataTypeRef), values)
}

export type UpdateAdminshipData = {
	_type: TypeRef<UpdateAdminshipData>;

	_format: NumberString;
	newAdminGroupEncGKey: Uint8Array;

	group: Id;
	newAdminGroup: Id;
}