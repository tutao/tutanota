// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const MailAddressAliasServiceDataTypeRef: TypeRef<MailAddressAliasServiceData> = new TypeRef("sys", "MailAddressAliasServiceData")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAliasServiceData",
	"since": 8,
	"type": "DATA_TRANSFER_TYPE",
	"id": 688,
	"rootId": "A3N5cwACsA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 689,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 690,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 691,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createMailAddressAliasServiceData(values?: $Shape<$Exact<MailAddressAliasServiceData>>): MailAddressAliasServiceData {
	return Object.assign(create(_TypeModel, MailAddressAliasServiceDataTypeRef), values)
}

export type MailAddressAliasServiceData = {
	_type: TypeRef<MailAddressAliasServiceData>;

	_format: NumberString;
	mailAddress: string;

	group: Id;
}