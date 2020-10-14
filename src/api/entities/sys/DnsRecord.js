// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const DnsRecordTypeRef: TypeRef<DnsRecord> = new TypeRef("sys", "DnsRecord")
export const _TypeModel: TypeModel = {
	"name": "DnsRecord",
	"since": 49,
	"type": "AGGREGATED_TYPE",
	"id": 1581,
	"rootId": "A3N5cwAGLQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1582,
			"since": 49,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"subdomain": {
			"name": "subdomain",
			"id": 1583,
			"since": 49,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1584,
			"since": 49,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 1585,
			"since": 49,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createDnsRecord(values?: $Shape<$Exact<DnsRecord>>): DnsRecord {
	return Object.assign(create(_TypeModel, DnsRecordTypeRef), values)
}

export type DnsRecord = {
	_type: TypeRef<DnsRecord>;

	_id: Id;
	subdomain: ?string;
	type: NumberString;
	value: string;
}