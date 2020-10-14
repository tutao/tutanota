// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PublicKeyReturnTypeRef: TypeRef<PublicKeyReturn> = new TypeRef("sys", "PublicKeyReturn")
export const _TypeModel: TypeModel = {
	"name": "PublicKeyReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 412,
	"rootId": "A3N5cwABnA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 413,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKey": {
			"name": "pubKey",
			"id": 414,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"name": "pubKeyVersion",
			"id": 415,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPublicKeyReturn(values?: $Shape<$Exact<PublicKeyReturn>>): PublicKeyReturn {
	return Object.assign(create(_TypeModel, PublicKeyReturnTypeRef), values)
}

export type PublicKeyReturn = {
	_type: TypeRef<PublicKeyReturn>;

	_format: NumberString;
	pubKey: Uint8Array;
	pubKeyVersion: NumberString;
}