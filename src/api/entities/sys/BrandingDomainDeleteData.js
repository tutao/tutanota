// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", "BrandingDomainDeleteData")
export const _TypeModel: TypeModel = {
	"name": "BrandingDomainDeleteData",
	"since": 22,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1155,
	"rootId": "A3N5cwAEgw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1156,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"id": 1157,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createBrandingDomainDeleteData(values?: $Shape<$Exact<BrandingDomainDeleteData>>): BrandingDomainDeleteData {
	return Object.assign(create(_TypeModel, BrandingDomainDeleteDataTypeRef), values)
}

export type BrandingDomainDeleteData = {
	_type: TypeRef<BrandingDomainDeleteData>;

	_format: NumberString;
	domain: string;
}