// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CustomDomainDataTypeRef: TypeRef<CustomDomainData> = new TypeRef("sys", "CustomDomainData")
export const _TypeModel: TypeModel = {
	"name": "CustomDomainData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 735,
	"rootId": "A3N5cwAC3w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 736,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 737,
			"since": 9,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"catchAllMailGroup": {
			"name": "catchAllMailGroup",
			"id": 1045,
			"since": 18,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCustomDomainData(values?: $Shape<$Exact<CustomDomainData>>): CustomDomainData {
	return Object.assign(create(_TypeModel, CustomDomainDataTypeRef), values)
}

export type CustomDomainData = {
	_type: TypeRef<CustomDomainData>;

	_format: NumberString;
	domain: string;

	catchAllMailGroup: ?Id;
}