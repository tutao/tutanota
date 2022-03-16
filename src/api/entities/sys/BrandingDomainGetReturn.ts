import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {CertificateInfo} from "./CertificateInfo.js"

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
			"refType": "CertificateInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createBrandingDomainGetReturn(values?: Partial<BrandingDomainGetReturn>): BrandingDomainGetReturn {
	return Object.assign(create(_TypeModel, BrandingDomainGetReturnTypeRef), downcast<BrandingDomainGetReturn>(values))
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;

	_format: NumberString;

	certificateInfo:  null | CertificateInfo;
}