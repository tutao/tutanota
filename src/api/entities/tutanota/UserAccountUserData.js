// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", "UserAccountUserData")
export const _TypeModel: TypeModel = {
	"name": "UserAccountUserData",
	"since": 16,
	"type": "AGGREGATED_TYPE",
	"id": 622,
	"rootId": "CHR1dGFub3RhAAJu",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 623, "since": 16, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"contactEncContactListSessionKey": {
			"name": "contactEncContactListSessionKey",
			"id": 637,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncContactGroupInfoSessionKey": {
			"name": "customerEncContactGroupInfoSessionKey",
			"id": 640,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncFileGroupInfoSessionKey": {
			"name": "customerEncFileGroupInfoSessionKey",
			"id": 641,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncMailGroupInfoSessionKey": {
			"name": "customerEncMailGroupInfoSessionKey",
			"id": 639,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"name": "encryptedName",
			"id": 625,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"fileEncFileSystemSessionKey": {
			"name": "fileEncFileSystemSessionKey",
			"id": 638,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 624,
			"since": 16,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailEncMailBoxSessionKey": {
			"name": "mailEncMailBoxSessionKey",
			"id": 636,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"name": "pwEncUserGroupKey",
			"id": 629,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeEncUserGroupKey": {
			"name": "recoverCodeEncUserGroupKey",
			"id": 893,
			"since": 29,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 894,
			"since": 29,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {"name": "salt", "id": 626, "since": 16, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 628,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncContactGroupKey": {
			"name": "userEncContactGroupKey",
			"id": 632,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncCustomerGroupKey": {
			"name": "userEncCustomerGroupKey",
			"id": 630,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncEntropy": {
			"name": "userEncEntropy",
			"id": 634,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncFileGroupKey": {
			"name": "userEncFileGroupKey",
			"id": 633,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncMailGroupKey": {
			"name": "userEncMailGroupKey",
			"id": 631,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncRecoverCode": {
			"name": "userEncRecoverCode",
			"id": 892,
			"since": 29,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncTutanotaPropertiesSessionKey": {
			"name": "userEncTutanotaPropertiesSessionKey",
			"id": 635,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {"name": "verifier", "id": 627, "since": 16, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createUserAccountUserData(values?: $Shape<$Exact<UserAccountUserData>>): UserAccountUserData {
	return Object.assign(create(_TypeModel, UserAccountUserDataTypeRef), values)
}
