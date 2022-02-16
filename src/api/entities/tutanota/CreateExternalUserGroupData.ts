import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", "CreateExternalUserGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateExternalUserGroupData",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 138,
	"rootId": "CHR1dGFub3RhAACK",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 139,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"internalUserEncUserGroupKey": {
			"id": 143,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 141,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalPwEncUserGroupKey": {
			"id": 142,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createCreateExternalUserGroupData(values?: Partial<CreateExternalUserGroupData>): CreateExternalUserGroupData {
	return Object.assign(create(_TypeModel, CreateExternalUserGroupDataTypeRef), downcast<CreateExternalUserGroupData>(values))
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;

	_id: Id;
	internalUserEncUserGroupKey: Uint8Array;
	mailAddress: string;
	externalPwEncUserGroupKey: Uint8Array;
}