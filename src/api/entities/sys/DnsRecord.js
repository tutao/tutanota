// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1582,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"subdomain": {
			"id": 1583,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 1584,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 1585,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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