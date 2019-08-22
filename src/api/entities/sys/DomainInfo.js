// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DomainInfoTypeRef: TypeRef<DomainInfo> = new TypeRef("sys", "DomainInfo")
export const _TypeModel: TypeModel = {
	"name": "DomainInfo",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 696,
	"rootId": "A3N5cwACuA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 697, "since": 9, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"certificateExpiryDate": {
			"name": "certificateExpiryDate",
			"id": 1134,
			"since": 22,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"domain": {"name": "domain", "id": 698, "since": 9, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"validatedMxRecord": {
			"name": "validatedMxRecord",
			"id": 699,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"catchAllMailGroup": {
			"name": "catchAllMailGroup",
			"id": 1044,
			"since": 18,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"certificate": {
			"name": "certificate",
			"id": 1135,
			"since": 22,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "SslCertificate",
			"final": true,
			"external": false
		},
		"whitelabelConfig": {
			"name": "whitelabelConfig",
			"id": 1136,
			"since": 22,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "WhitelabelConfig",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createDomainInfo(values?: $Shape<$Exact<DomainInfo>>): DomainInfo {
	return Object.assign(create(_TypeModel, DomainInfoTypeRef), values)
}
