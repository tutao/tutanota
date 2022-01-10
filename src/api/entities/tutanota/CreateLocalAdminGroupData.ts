import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {InternalGroupData} from "./InternalGroupData.js"

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
			"refType": "InternalGroupData",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createCreateLocalAdminGroupData(values?: Partial<CreateLocalAdminGroupData>): CreateLocalAdminGroupData {
	return Object.assign(create(_TypeModel, CreateLocalAdminGroupDataTypeRef), downcast<CreateLocalAdminGroupData>(values))
}

export type CreateLocalAdminGroupData = {
	_type: TypeRef<CreateLocalAdminGroupData>;

	_format: NumberString;
	encryptedName: Uint8Array;

	groupData: InternalGroupData;
}