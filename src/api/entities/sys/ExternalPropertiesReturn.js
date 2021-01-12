// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 664,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"id": 666,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"message": {
			"id": 665,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bigLogo": {
			"id": 925,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "File"
		},
		"smallLogo": {
			"id": 924,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "File"
		}
	},
	"app": "sys",
	"version": "68"
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