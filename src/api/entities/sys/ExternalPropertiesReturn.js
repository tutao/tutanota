// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {File} from "./File"

export const ExternalPropertiesReturnTypeRef: TypeRef<ExternalPropertiesReturn> = new TypeRef("sys", "ExternalPropertiesReturn")
export const _TypeModel: TypeModel = {
	"name": "ExternalPropertiesReturn",
	"since": 6,
	"type": "DATA_TRANSFER_TYPE",
	"id": 663,
	"rootId": "A3N5cwAClw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 664,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 666,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"message": {
			"name": "message",
			"id": 665,
			"since": 6,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bigLogo": {
			"name": "bigLogo",
			"id": 925,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false
		},
		"smallLogo": {
			"name": "smallLogo",
			"id": 924,
			"since": 11,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createExternalPropertiesReturn(values?: $Shape<$Exact<ExternalPropertiesReturn>>): ExternalPropertiesReturn {
	return Object.assign(create(_TypeModel, ExternalPropertiesReturnTypeRef), values)
}

export type ExternalPropertiesReturn = {
	_type: TypeRef<ExternalPropertiesReturn>;

	_format: NumberString;
	accountType: NumberString;
	message: string;

	bigLogo: ?File;
	smallLogo: ?File;
}