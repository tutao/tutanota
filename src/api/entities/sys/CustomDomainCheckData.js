// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CustomDomainCheckDataTypeRef: TypeRef<CustomDomainCheckData> = new TypeRef("sys", "CustomDomainCheckData")
export const _TypeModel: TypeModel = {
	"name": "CustomDomainCheckData",
	"since": 49,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1586,
	"rootId": "A3N5cwAGMg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1587,
			"since": 49,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 1588,
			"since": 49,
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

export function createCustomDomainCheckData(values?: $Shape<$Exact<CustomDomainCheckData>>): CustomDomainCheckData {
	return Object.assign(create(_TypeModel, CustomDomainCheckDataTypeRef), values)
}

export type CustomDomainCheckData = {
	_type: TypeRef<CustomDomainCheckData>;

	_format: NumberString;
	domain: string;
}