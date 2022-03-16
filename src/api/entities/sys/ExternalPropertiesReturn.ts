import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {File} from "./File.js"

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
			"refType": "File",
			"dependency": null
		},
		"smallLogo": {
			"id": 924,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "File",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createExternalPropertiesReturn(values?: Partial<ExternalPropertiesReturn>): ExternalPropertiesReturn {
	return Object.assign(create(_TypeModel, ExternalPropertiesReturnTypeRef), downcast<ExternalPropertiesReturn>(values))
}

export type ExternalPropertiesReturn = {
	_type: TypeRef<ExternalPropertiesReturn>;

	_format: NumberString;
	accountType: NumberString;
	message: string;

	bigLogo:  null | File;
	smallLogo:  null | File;
}