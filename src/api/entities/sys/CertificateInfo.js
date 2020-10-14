// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1501,
			"since": 44,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"expiryDate": {
			"name": "expiryDate",
			"id": 1502,
			"since": 44,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"state": {
			"name": "state",
			"id": 1503,
			"since": 44,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1504,
			"since": 44,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"certificate": {
			"name": "certificate",
			"id": 1505,
			"since": 44,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "SslCertificate",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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