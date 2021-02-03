// @flow

import {create} from "../../common/utils/EntityUtils"

import type {PasswordChannelPhoneNumber} from "./PasswordChannelPhoneNumber"
import {TypeRef} from "../../common/utils/TypeRef";

export const PasswordChannelReturnTypeRef: TypeRef<PasswordChannelReturn> = new TypeRef("tutanota", "PasswordChannelReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordChannelReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 327,
	"rootId": "CHR1dGFub3RhAAFH",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 328,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"phoneNumberChannels": {
			"id": 329,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "PasswordChannelPhoneNumber"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createPasswordChannelReturn(values?: $Shape<$Exact<PasswordChannelReturn>>): PasswordChannelReturn {
	return Object.assign(create(_TypeModel, PasswordChannelReturnTypeRef), values)
}

export type PasswordChannelReturn = {
	_type: TypeRef<PasswordChannelReturn>;

	_format: NumberString;

	phoneNumberChannels: PasswordChannelPhoneNumber[];
}