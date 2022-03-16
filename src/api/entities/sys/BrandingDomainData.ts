import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BrandingDomainDataTypeRef: TypeRef<BrandingDomainData> = new TypeRef("sys", "BrandingDomainData")
export const _TypeModel: TypeModel = {
	"name": "BrandingDomainData",
	"since": 22,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1149,
	"rootId": "A3N5cwAEfQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1150,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"id": 1151,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sessionEncPemCertificateChain": {
			"id": 1152,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"sessionEncPemPrivateKey": {
			"id": 1153,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"systemAdminPubEncSessionKey": {
			"id": 1154,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createBrandingDomainData(values?: Partial<BrandingDomainData>): BrandingDomainData {
	return Object.assign(create(_TypeModel, BrandingDomainDataTypeRef), downcast<BrandingDomainData>(values))
}

export type BrandingDomainData = {
	_type: TypeRef<BrandingDomainData>;

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
}