// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {DnsRecord} from "./DnsRecord"

export const CustomDomainCheckReturnTypeRef: TypeRef<CustomDomainCheckReturn> = new TypeRef("sys", "CustomDomainCheckReturn")
export const _TypeModel: TypeModel = {
	"name": "CustomDomainCheckReturn",
	"since": 49,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1589,
	"rootId": "A3N5cwAGNQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1590,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"checkResult": {
			"id": 1591,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invalidRecords": {
			"id": 1593,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "DnsRecord"
		},
		"missingRecords": {
			"id": 1592,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "DnsRecord"
		},
		"requiredRecords": {
			"id": 1758,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "DnsRecord"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createCustomDomainCheckReturn(values?: $Shape<$Exact<CustomDomainCheckReturn>>): CustomDomainCheckReturn {
	return Object.assign(create(_TypeModel, CustomDomainCheckReturnTypeRef), values)
}

export type CustomDomainCheckReturn = {
	_type: TypeRef<CustomDomainCheckReturn>;

	_format: NumberString;
	checkResult: NumberString;

	invalidRecords: DnsRecord[];
	missingRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}