// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 302,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"freeGroupKey": {
			"id": 305,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"premiumGroupKey": {
			"id": 306,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"starterGroupKey": {
			"id": 307,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemAdminPubKey": {
			"id": 303,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"systemAdminPubKeyVersion": {
			"id": 304,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"freeGroup": {
			"id": 880,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group"
		},
		"premiumGroup": {
			"id": 881,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createSystemKeysReturn(values?: $Shape<$Exact<SystemKeysReturn>>): SystemKeysReturn {
	return Object.assign(create(_TypeModel, SystemKeysReturnTypeRef), values)
}

export type SystemKeysReturn = {
	_type: TypeRef<SystemKeysReturn>;

	_format: NumberString;
	freeGroupKey: Uint8Array;
	premiumGroupKey: Uint8Array;
	starterGroupKey: Uint8Array;
	systemAdminPubKey: Uint8Array;
	systemAdminPubKeyVersion: NumberString;

	freeGroup: ?Id;
	premiumGroup: ?Id;
}