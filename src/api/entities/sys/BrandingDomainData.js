// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1150,
			"since": 22,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 1151,
			"since": 22,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sessionEncPemCertificateChain": {
			"name": "sessionEncPemCertificateChain",
			"id": 1152,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sessionEncPemPrivateKey": {
			"name": "sessionEncPemPrivateKey",
			"id": 1153,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"systemAdminPubEncSessionKey": {
			"name": "systemAdminPubEncSessionKey",
			"id": 1154,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createBrandingDomainData(): BrandingDomainData {
	return create(_TypeModel)
}
