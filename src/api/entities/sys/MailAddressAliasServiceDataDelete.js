// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const MailAddressAliasServiceDataDeleteTypeRef: TypeRef<MailAddressAliasServiceDataDelete> = new TypeRef("sys", "MailAddressAliasServiceDataDelete")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAliasServiceDataDelete",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 785,
	"rootId": "A3N5cwADEQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 786,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 787,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"name": "restore",
			"id": 788,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 789,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createMailAddressAliasServiceDataDelete(values?: $Shape<$Exact<MailAddressAliasServiceDataDelete>>): MailAddressAliasServiceDataDelete {
	return Object.assign(create(_TypeModel, MailAddressAliasServiceDataDeleteTypeRef), values)
}

export type MailAddressAliasServiceDataDelete = {
	_type: TypeRef<MailAddressAliasServiceDataDelete>;

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	group: Id;
}