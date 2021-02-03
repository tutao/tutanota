// @flow

import {create} from "../../common/utils/EntityUtils"

import type {InternalGroupData} from "./InternalGroupData"
import {TypeRef} from "../../common/utils/TypeRef";

export const CreateLocalAdminGroupDataTypeRef: TypeRef<CreateLocalAdminGroupData> = new TypeRef("tutanota", "CreateLocalAdminGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateLocalAdminGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 703,
	"rootId": "CHR1dGFub3RhAAK_",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 704,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"id": 705,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupData": {
			"id": 706,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCreateLocalAdminGroupData(values?: $Shape<$Exact<CreateLocalAdminGroupData>>): CreateLocalAdminGroupData {
	return Object.assign(create(_TypeModel, CreateLocalAdminGroupDataTypeRef), values)
}

export type CreateLocalAdminGroupData = {
	_type: TypeRef<CreateLocalAdminGroupData>;

	_format: NumberString;
	encryptedName: Uint8Array;

	groupData: InternalGroupData;
}