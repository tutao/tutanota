import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const TakeOverDeletedAddressDataTypeRef: TypeRef<TakeOverDeletedAddressData> = new TypeRef("sys", "TakeOverDeletedAddressData")
export const _TypeModel: TypeModel = {
	"name": "TakeOverDeletedAddressData",
	"since": 63,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1759,
	"rootId": "A3N5cwAG3w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1760,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"id": 1762,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1761,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"id": 1763,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"targetAccountMailAddress": {
			"id": 1764,
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

export function createTakeOverDeletedAddressData(values?: Partial<TakeOverDeletedAddressData>): TakeOverDeletedAddressData {
	return Object.assign(create(_TypeModel, TakeOverDeletedAddressDataTypeRef), downcast<TakeOverDeletedAddressData>(values))
}

export type TakeOverDeletedAddressData = {
	_type: TypeRef<TakeOverDeletedAddressData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}