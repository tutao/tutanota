// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const PasswordMessagingDataTypeRef: TypeRef<PasswordMessagingData> = new TypeRef("tutanota", "PasswordMessagingData")
export const _TypeModel: TypeModel = {
	"name": "PasswordMessagingData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 308,
	"rootId": "CHR1dGFub3RhAAE0",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 309,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"id": 310,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"numberId": {
			"id": 311,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"symKeyForPasswordTransmission": {
			"id": 312,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createPasswordMessagingData(values?: $Shape<$Exact<PasswordMessagingData>>): PasswordMessagingData {
	return Object.assign(create(_TypeModel, PasswordMessagingDataTypeRef), values)
}

export type PasswordMessagingData = {
	_type: TypeRef<PasswordMessagingData>;

	_format: NumberString;
	language: string;
	numberId: Id;
	symKeyForPasswordTransmission: Uint8Array;
}