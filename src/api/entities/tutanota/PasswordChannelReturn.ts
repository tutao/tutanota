import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {PasswordChannelPhoneNumber} from "./PasswordChannelPhoneNumber.js"

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
			"refType": "PasswordChannelPhoneNumber",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createPasswordChannelReturn(values?: Partial<PasswordChannelReturn>): PasswordChannelReturn {
	return Object.assign(create(_TypeModel, PasswordChannelReturnTypeRef), downcast<PasswordChannelReturn>(values))
}

export type PasswordChannelReturn = {
	_type: TypeRef<PasswordChannelReturn>;

	_format: NumberString;

	phoneNumberChannels: PasswordChannelPhoneNumber[];
}