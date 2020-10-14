// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {StringWrapper} from "./StringWrapper"

export const CustomDomainReturnTypeRef: TypeRef<CustomDomainReturn> = new TypeRef("sys", "CustomDomainReturn")
export const _TypeModel: TypeModel = {
	"name": "CustomDomainReturn",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 731,
	"rootId": "A3N5cwAC2w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 732,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"validationResult": {
			"name": "validationResult",
			"id": 733,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invalidDnsRecords": {
			"name": "invalidDnsRecords",
			"id": 734,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "StringWrapper",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomDomainReturn(values?: $Shape<$Exact<CustomDomainReturn>>): CustomDomainReturn {
	return Object.assign(create(_TypeModel, CustomDomainReturnTypeRef), values)
}

export type CustomDomainReturn = {
	_type: TypeRef<CustomDomainReturn>;

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}