// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {CreateExternalUserGroupData} from "./CreateExternalUserGroupData"

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
		"_format": {
			"id": 146,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalMailEncMailBoxSessionKey": {
			"id": 673,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalMailEncMailGroupInfoSessionKey": {
			"id": 670,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncEntropy": {
			"id": 412,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncMailGroupKey": {
			"id": 148,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncTutanotaPropertiesSessionKey": {
			"id": 672,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"externalUserEncUserGroupInfoSessionKey": {
			"id": 150,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"internalMailEncMailGroupInfoSessionKey": {
			"id": 671,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"internalMailEncUserGroupInfoSessionKey": {
			"id": 669,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 147,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 149,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userGroupData": {
			"id": 151,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CreateExternalUserGroupData"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createExternalUserData(values?: $Shape<$Exact<ExternalUserData>>): ExternalUserData {
	return Object.assign(create(_TypeModel, ExternalUserDataTypeRef), values)
}

export type ExternalUserData = {
	_type: TypeRef<ExternalUserData>;

	_format: NumberString;
	externalMailEncMailBoxSessionKey: Uint8Array;
	externalMailEncMailGroupInfoSessionKey: Uint8Array;
	externalUserEncEntropy: Uint8Array;
	externalUserEncMailGroupKey: Uint8Array;
	externalUserEncTutanotaPropertiesSessionKey: Uint8Array;
	externalUserEncUserGroupInfoSessionKey: Uint8Array;
	internalMailEncMailGroupInfoSessionKey: Uint8Array;
	internalMailEncUserGroupInfoSessionKey: Uint8Array;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	userGroupData: CreateExternalUserGroupData;
}