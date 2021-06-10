// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "46"
}

export function createCreateExternalUserGroupData(values?: $Shape<$Exact<CreateExternalUserGroupData>>): CreateExternalUserGroupData {
	return Object.assign(create(_TypeModel, CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;

	_id: Id;
	internalUserEncUserGroupKey: Uint8Array;
	mailAddress: string;
	externalPwEncUserGroupKey: Uint8Array;
}