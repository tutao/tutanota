// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "SslCertificate"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createCertificateInfo(values?: $Shape<$Exact<CertificateInfo>>): CertificateInfo {
	return Object.assign(create(_TypeModel, CertificateInfoTypeRef), values)
}

export type CertificateInfo = {
	_type: TypeRef<CertificateInfo>;

	_id: Id;
	expiryDate: ?Date;
	state: NumberString;
	type: NumberString;

	certificate: ?Id;
}