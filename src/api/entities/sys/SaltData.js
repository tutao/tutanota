// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", "SaltData")
export const _TypeModel: TypeModel = {
	"name": "SaltData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 417,
	"rootId": "A3N5cwABoQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 418,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 419,
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

export function createSaltData(values?: $Shape<$Exact<SaltData>>): SaltData {
	return Object.assign(create(_TypeModel, SaltDataTypeRef), values)
}

export type SaltData = {
	_type: TypeRef<SaltData>;

	_format: NumberString;
	mailAddress: string;
}