// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateLocalAdminGroupDataTypeRef: TypeRef<CreateLocalAdminGroupData> = new TypeRef("tutanota", "CreateLocalAdminGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateLocalAdminGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 704,
	"rootId": "CHR1dGFub3RhAALA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 705, "since": 19, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"encryptedName": {"name": "encryptedName", "id": 706, "since": 19, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"groupData": {
			"name": "groupData",
			"id": 707,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createCreateLocalAdminGroupData(): CreateLocalAdminGroupData {
	return create(_TypeModel, CreateLocalAdminGroupDataTypeRef)
}
