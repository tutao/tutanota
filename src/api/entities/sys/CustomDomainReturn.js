// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
		"statusCode": {
			"name": "statusCode",
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
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "StringWrapper",
			"final": true
		}
	},
	"app": "sys",
	"version": "25"
}

export function createCustomDomainReturn(): CustomDomainReturn {
	return create(_TypeModel)
}
