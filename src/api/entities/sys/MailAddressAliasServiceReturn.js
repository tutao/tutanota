// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const MailAddressAliasServiceReturnTypeRef: TypeRef<MailAddressAliasServiceReturn> = new TypeRef("sys", "MailAddressAliasServiceReturn")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAliasServiceReturn",
	"since": 8,
	"type": "DATA_TRANSFER_TYPE",
	"id": 692,
	"rootId": "A3N5cwACtA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 693,
			"since": 8,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"enabledAliases": {
			"name": "enabledAliases",
			"id": 1071,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"nbrOfFreeAliases": {
			"name": "nbrOfFreeAliases",
			"id": 694,
			"since": 8,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"totalAliases": {
			"name": "totalAliases",
			"id": 1069,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"usedAliases": {
			"name": "usedAliases",
			"id": 1070,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createMailAddressAliasServiceReturn(values?: $Shape<$Exact<MailAddressAliasServiceReturn>>): MailAddressAliasServiceReturn {
	return Object.assign(create(_TypeModel, MailAddressAliasServiceReturnTypeRef), values)
}

export type MailAddressAliasServiceReturn = {
	_type: TypeRef<MailAddressAliasServiceReturn>;

	_format: NumberString;
	enabledAliases: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
}