import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", "SaltReturn")
export const _TypeModel: TypeModel = {
	"name": "SaltReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 420,
	"rootId": "A3N5cwABpA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 421,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 422,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createSaltReturn(values?: Partial<SaltReturn>): SaltReturn {
	return Object.assign(create(_TypeModel, SaltReturnTypeRef), downcast<SaltReturn>(values))
}

export type SaltReturn = {
	_type: TypeRef<SaltReturn>;

	_format: NumberString;
	salt: Uint8Array;
}