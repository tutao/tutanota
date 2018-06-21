// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 689,
			"since": 8,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 690,
			"since": 8,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 691,
			"since": 8,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createMailAddressAliasServiceData(): MailAddressAliasServiceData {
	return create(_TypeModel)
}
