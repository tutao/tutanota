import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PasswordChannelPhoneNumberTypeRef: TypeRef<PasswordChannelPhoneNumber> = new TypeRef("tutanota", "PasswordChannelPhoneNumber")
export const _TypeModel: TypeModel = {
	"name": "PasswordChannelPhoneNumber",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 135,
	"rootId": "CHR1dGFub3RhAACH",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 136,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"number": {
			"id": 137,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createPasswordChannelPhoneNumber(values?: Partial<PasswordChannelPhoneNumber>): PasswordChannelPhoneNumber {
	return Object.assign(create(_TypeModel, PasswordChannelPhoneNumberTypeRef), downcast<PasswordChannelPhoneNumber>(values))
}

export type PasswordChannelPhoneNumber = {
	_type: TypeRef<PasswordChannelPhoneNumber>;

	_id: Id;
	number: string;
}