import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 413,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKey": {
			"id": 414,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"id": 415,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createPublicKeyReturn(values?: Partial<PublicKeyReturn>): PublicKeyReturn {
	return Object.assign(create(_TypeModel, PublicKeyReturnTypeRef), downcast<PublicKeyReturn>(values))
}

export type PublicKeyReturn = {
	_type: TypeRef<PublicKeyReturn>;

	_format: NumberString;
	pubKey: Uint8Array;
	pubKeyVersion: NumberString;
}