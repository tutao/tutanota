// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 685,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"id": 784,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 686,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
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