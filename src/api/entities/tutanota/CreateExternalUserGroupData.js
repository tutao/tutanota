// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
		"_id": {"name": "_id", "id": 139, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"internalUserEncUserGroupKey": {
			"name": "internalUserEncUserGroupKey",
			"id": 143,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 141,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalPwEncUserGroupKey": {
			"name": "externalPwEncUserGroupKey",
			"id": 142,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createCreateExternalUserGroupData(values?: $Shape<$Exact<CreateExternalUserGroupData>>): CreateExternalUserGroupData {
	return Object.assign(create(_TypeModel, CreateExternalUserGroupDataTypeRef), values)
}
