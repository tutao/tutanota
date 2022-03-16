import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 736,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"id": 737,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"catchAllMailGroup": {
			"id": 1045,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCustomDomainData(values?: Partial<CustomDomainData>): CustomDomainData {
	return Object.assign(create(_TypeModel, CustomDomainDataTypeRef), downcast<CustomDomainData>(values))
}

export type CustomDomainData = {
	_type: TypeRef<CustomDomainData>;

	_format: NumberString;
	domain: string;

	catchAllMailGroup:  null | Id;
}