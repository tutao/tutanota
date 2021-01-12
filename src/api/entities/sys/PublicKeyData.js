// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "68"
}

export function createPublicKeyData(values?: $Shape<$Exact<PublicKeyData>>): PublicKeyData {
	return Object.assign(create(_TypeModel, PublicKeyDataTypeRef), values)
}

export type PublicKeyData = {
	_type: TypeRef<PublicKeyData>;

	_format: NumberString;
	mailAddress: string;
}