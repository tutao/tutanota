// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 786,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 787,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"id": 788,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 789,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
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