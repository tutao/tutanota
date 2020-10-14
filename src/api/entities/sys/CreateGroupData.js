// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 357,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGKey": {
			"name": "adminEncGKey",
			"id": 363,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncUserGroupInfoSessionKey": {
			"name": "customerEncUserGroupInfoSessionKey",
			"id": 1040,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"name": "encryptedName",
			"id": 358,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"listEncSessionKey": {
			"name": "listEncSessionKey",
			"id": 364,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 359,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pubKey": {
			"name": "pubKey",
			"id": 360,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncGKey": {
			"name": "symEncGKey",
			"id": 362,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncPrivKey": {
			"name": "symEncPrivKey",
			"id": 361,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
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