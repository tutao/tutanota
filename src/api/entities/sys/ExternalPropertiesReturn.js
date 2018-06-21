// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
	"version": "32"
}

export function createExternalPropertiesReturn(): ExternalPropertiesReturn {
	return create(_TypeModel)
}
