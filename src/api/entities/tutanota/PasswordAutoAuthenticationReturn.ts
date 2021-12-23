import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const PasswordAutoAuthenticationReturnTypeRef: TypeRef<PasswordAutoAuthenticationReturn> = new TypeRef("tutanota", "PasswordAutoAuthenticationReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordAutoAuthenticationReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 317,
	"rootId": "CHR1dGFub3RhAAE9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 318,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createPasswordAutoAuthenticationReturn(values?: Partial<PasswordAutoAuthenticationReturn>): PasswordAutoAuthenticationReturn {
	return Object.assign(create(_TypeModel, PasswordAutoAuthenticationReturnTypeRef), downcast<PasswordAutoAuthenticationReturn>(values))
}

export type PasswordAutoAuthenticationReturn = {
	_type: TypeRef<PasswordAutoAuthenticationReturn>;

	_format: NumberString;
}