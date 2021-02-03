// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 623,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"contactEncContactListSessionKey": {
			"id": 637,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncContactGroupInfoSessionKey": {
			"id": 640,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncFileGroupInfoSessionKey": {
			"id": 641,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncMailGroupInfoSessionKey": {
			"id": 639,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"id": 625,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"fileEncFileSystemSessionKey": {
			"id": 638,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 624,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailEncMailBoxSessionKey": {
			"id": 636,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"id": 629,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeEncUserGroupKey": {
			"id": 893,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"id": 894,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 626,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 628,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncContactGroupKey": {
			"id": 632,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncCustomerGroupKey": {
			"id": 630,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncEntropy": {
			"id": 634,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncFileGroupKey": {
			"id": 633,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncMailGroupKey": {
			"id": 631,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncRecoverCode": {
			"id": 892,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncTutanotaPropertiesSessionKey": {
			"id": 635,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 627,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createUserAccountUserData(values?: $Shape<$Exact<UserAccountUserData>>): UserAccountUserData {
	return Object.assign(create(_TypeModel, UserAccountUserDataTypeRef), values)
}

export type UserAccountUserData = {
	_type: TypeRef<UserAccountUserData>;

	_id: Id;
	contactEncContactListSessionKey: Uint8Array;
	customerEncContactGroupInfoSessionKey: Uint8Array;
	customerEncFileGroupInfoSessionKey: Uint8Array;
	customerEncMailGroupInfoSessionKey: Uint8Array;
	encryptedName: Uint8Array;
	fileEncFileSystemSessionKey: Uint8Array;
	mailAddress: string;
	mailEncMailBoxSessionKey: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: Uint8Array;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
	userEncContactGroupKey: Uint8Array;
	userEncCustomerGroupKey: Uint8Array;
	userEncEntropy: Uint8Array;
	userEncFileGroupKey: Uint8Array;
	userEncMailGroupKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	userEncTutanotaPropertiesSessionKey: Uint8Array;
	verifier: Uint8Array;
}