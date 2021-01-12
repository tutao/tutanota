// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
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