// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const SwitchAccountTypeDataTypeRef: TypeRef<SwitchAccountTypeData> = new TypeRef("sys", "SwitchAccountTypeData")
export const _TypeModel: TypeModel = {
	"name": "SwitchAccountTypeData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 772,
	"rootId": "A3N5cwADBA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 773,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 774,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 775,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"proUpgrade": {
			"name": "proUpgrade",
			"id": 1310,
			"since": 30,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createSwitchAccountTypeData(): SwitchAccountTypeData {
	return create(_TypeModel)
}
