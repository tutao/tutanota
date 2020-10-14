// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {CertificateInfo} from "./CertificateInfo"

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
			"name": "_format",
			"id": 1724,
			"since": 56,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"certificateInfo": {
			"name": "certificateInfo",
			"id": 1725,
			"since": 56,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "CertificateInfo",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createBrandingDomainGetReturn(values?: $Shape<$Exact<BrandingDomainGetReturn>>): BrandingDomainGetReturn {
	return Object.assign(create(_TypeModel, BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;

	_format: NumberString;

	certificateInfo: ?CertificateInfo;
}