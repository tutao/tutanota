// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", "ExternalUserData")
export const _TypeModel: TypeModel = {
	"name": "ExternalUserData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 145,
	"rootId": "CHR1dGFub3RhAACR",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 146, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"externalMailEncMailBoxSessionKey": {
			"name": "externalMailEncMailBoxSessionKey",
			"id": 673,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalMailEncMailGroupInfoSessionKey": {
			"name": "externalMailEncMailGroupInfoSessionKey",
			"id": 670,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncEntropy": {
			"name": "externalUserEncEntropy",
			"id": 412,
			"since": 2,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncMailGroupKey": {
			"name": "externalUserEncMailGroupKey",
			"id": 148,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncTutanotaPropertiesSessionKey": {
			"name": "externalUserEncTutanotaPropertiesSessionKey",
			"id": 672,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncUserGroupInfoSessionKey": {
			"name": "externalUserEncUserGroupInfoSessionKey",
			"id": 150,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"internalMailEncMailGroupInfoSessionKey": {
			"name": "internalMailEncMailGroupInfoSessionKey",
			"id": 671,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"internalMailEncUserGroupInfoSessionKey": {
			"name": "internalMailEncUserGroupInfoSessionKey",
			"id": 669,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 147,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {"name": "verifier", "id": 149, "since": 1, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"userGroupData": {
			"name": "userGroupData",
			"id": 151,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CreateExternalUserGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createExternalUserData(values?: $Shape<$Exact<ExternalUserData>>): ExternalUserData {
	return Object.assign(create(_TypeModel, ExternalUserDataTypeRef), values)
}
