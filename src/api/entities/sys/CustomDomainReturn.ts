import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {StringWrapper} from "./StringWrapper.js"

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
			"id": 732,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"validationResult": {
			"id": 733,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"invalidDnsRecords": {
			"id": 734,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "StringWrapper",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCustomDomainReturn(values?: Partial<CustomDomainReturn>): CustomDomainReturn {
	return Object.assign(create(_TypeModel, CustomDomainReturnTypeRef), downcast<CustomDomainReturn>(values))
}

export type CustomDomainReturn = {
	_type: TypeRef<CustomDomainReturn>;

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}