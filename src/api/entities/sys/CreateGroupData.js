// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const CreateGroupDataTypeRef: TypeRef<CreateGroupData> = new TypeRef("sys", "CreateGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateGroupData",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 356,
	"rootId": "A3N5cwABZA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 357,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGKey": {
			"id": 363,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncUserGroupInfoSessionKey": {
			"id": 1040,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"id": 358,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"listEncSessionKey": {
			"id": 364,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 359,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pubKey": {
			"id": 360,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncGKey": {
			"id": 362,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncPrivKey": {
			"id": 361,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createCreateGroupData(values?: $Shape<$Exact<CreateGroupData>>): CreateGroupData {
	return Object.assign(create(_TypeModel, CreateGroupDataTypeRef), values)
}

export type CreateGroupData = {
	_type: TypeRef<CreateGroupData>;

	_id: Id;
	adminEncGKey: Uint8Array;
	customerEncUserGroupInfoSessionKey: ?Uint8Array;
	encryptedName: Uint8Array;
	listEncSessionKey: Uint8Array;
	mailAddress: ?string;
	pubKey: Uint8Array;
	symEncGKey: Uint8Array;
	symEncPrivKey: Uint8Array;
}