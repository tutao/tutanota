// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const PasswordRetrievalReturnTypeRef: TypeRef<PasswordRetrievalReturn> = new TypeRef("tutanota", "PasswordRetrievalReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordRetrievalReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 323,
	"rootId": "CHR1dGFub3RhAAFD",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 324,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"transmissionKeyEncryptedPassword": {
			"id": 325,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createPasswordRetrievalReturn(values?: $Shape<$Exact<PasswordRetrievalReturn>>): PasswordRetrievalReturn {
	return Object.assign(create(_TypeModel, PasswordRetrievalReturnTypeRef), values)
}

export type PasswordRetrievalReturn = {
	_type: TypeRef<PasswordRetrievalReturn>;

	_format: NumberString;
	transmissionKeyEncryptedPassword: string;
}