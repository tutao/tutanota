// @flow

import {create} from "../../common/utils/EntityUtils"

import type {CertificateInfo} from "./CertificateInfo"
import {TypeRef} from "../../common/utils/TypeRef";

export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", "BrandingDomainGetReturn")
export const _TypeModel: TypeModel = {
	"name": "BrandingDomainGetReturn",
	"since": 56,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1723,
	"rootId": "A3N5cwAGuw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1724,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"certificateInfo": {
			"id": 1725,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CertificateInfo"
		}
	},
	"app": "sys",
	"version": "67"
}

export function createBrandingDomainGetReturn(values?: $Shape<$Exact<BrandingDomainGetReturn>>): BrandingDomainGetReturn {
	return Object.assign(create(_TypeModel, BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;

	_format: NumberString;

	certificateInfo: ?CertificateInfo;
}