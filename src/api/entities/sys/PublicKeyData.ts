import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PublicKeyDataTypeRef: TypeRef<PublicKeyData> = new TypeRef("sys", "PublicKeyData")
export const _TypeModel: TypeModel = {
	"name": "PublicKeyData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 409,
	"rootId": "A3N5cwABmQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 410,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 411,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createPublicKeyData(values?: Partial<PublicKeyData>): PublicKeyData {
	return Object.assign(create(_TypeModel, PublicKeyDataTypeRef), downcast<PublicKeyData>(values))
}

export type PublicKeyData = {
	_type: TypeRef<PublicKeyData>;

	_format: NumberString;
	mailAddress: string;
}