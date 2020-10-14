// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1760,
			"since": 63,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 1762,
			"since": 63,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 1761,
			"since": 63,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1763,
			"since": 63,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"targetAccountMailAddress": {
			"name": "targetAccountMailAddress",
			"id": 1764,
			"since": 63,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createTakeOverDeletedAddressData(values?: $Shape<$Exact<TakeOverDeletedAddressData>>): TakeOverDeletedAddressData {
	return Object.assign(create(_TypeModel, TakeOverDeletedAddressDataTypeRef), values)
}

export type TakeOverDeletedAddressData = {
	_type: TypeRef<TakeOverDeletedAddressData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: ?string;
	targetAccountMailAddress: string;
}