// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
		"_id": {
			"id": 697,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"domain": {
			"id": 698,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"validatedMxRecord": {
			"id": 699,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"catchAllMailGroup": {
			"id": 1044,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group"
		},
		"whitelabelConfig": {
			"id": 1136,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WhitelabelConfig"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createDomainInfo(values?: $Shape<$Exact<DomainInfo>>): DomainInfo {
	return Object.assign(create(_TypeModel, DomainInfoTypeRef), values)
}

export type DomainInfo = {
	_type: TypeRef<DomainInfo>;

	_id: Id;
	domain: string;
	validatedMxRecord: boolean;

	catchAllMailGroup: ?Id;
	whitelabelConfig: ?Id;
}