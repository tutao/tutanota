import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const CertificateInfoTypeRef: TypeRef<CertificateInfo> = new TypeRef("sys", "CertificateInfo")
export const _TypeModel: TypeModel = {
	"name": "CertificateInfo",
	"since": 44,
	"type": "AGGREGATED_TYPE",
	"id": 1500,
	"rootId": "A3N5cwAF3A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1501,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"expiryDate": {
			"id": 1502,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"state": {
			"id": 1503,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1504,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"certificate": {
			"id": 1505,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "SslCertificate",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCertificateInfo(values?: Partial<CertificateInfo>): CertificateInfo {
	return Object.assign(create(_TypeModel, CertificateInfoTypeRef), downcast<CertificateInfo>(values))
}

export type CertificateInfo = {
	_type: TypeRef<CertificateInfo>;

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate:  null | Id;
}