// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SystemKeysReturnTypeRef: TypeRef<SystemKeysReturn> = new TypeRef("sys", "SystemKeysReturn")
export const _TypeModel: TypeModel = {
	"name": "SystemKeysReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 301,
	"rootId": "A3N5cwABLQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 302,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"freeGroupKey": {
			"name": "freeGroupKey",
			"id": 305,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"premiumGroupKey": {
			"name": "premiumGroupKey",
			"id": 306,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"starterGroupKey": {
			"name": "starterGroupKey",
			"id": 307,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemAdminPubKey": {
			"name": "systemAdminPubKey",
			"id": 303,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemAdminPubKeyVersion": {
			"name": "systemAdminPubKeyVersion",
			"id": 304,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"freeGroup": {
			"name": "freeGroup",
			"id": 880,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": false,
			"external": false
		},
		"premiumGroup": {
			"name": "premiumGroup",
			"id": 881,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createSystemKeysReturn(values?: $Shape<$Exact<SystemKeysReturn>>): SystemKeysReturn {
	return Object.assign(create(_TypeModel, SystemKeysReturnTypeRef), values)
}
