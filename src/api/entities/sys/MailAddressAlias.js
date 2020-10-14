// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const MailAddressAliasTypeRef: TypeRef<MailAddressAlias> = new TypeRef("sys", "MailAddressAlias")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAlias",
	"since": 8,
	"type": "AGGREGATED_TYPE",
	"id": 684,
	"rootId": "A3N5cwACrA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 685,
			"since": 8,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"name": "enabled",
			"id": 784,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 686,
			"since": 8,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createMailAddressAlias(values?: $Shape<$Exact<MailAddressAlias>>): MailAddressAlias {
	return Object.assign(create(_TypeModel, MailAddressAliasTypeRef), values)
}

export type MailAddressAlias = {
	_type: TypeRef<MailAddressAlias>;

	_id: Id;
	enabled: boolean;
	mailAddress: string;
}