// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const DomainsRefTypeRef: TypeRef<DomainsRef> = new TypeRef("sys", "DomainsRef")
export const _TypeModel: TypeModel = {
	"name": "DomainsRef",
	"since": 21,
	"type": "AGGREGATED_TYPE",
	"id": 1096,
	"rootId": "A3N5cwAESA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1097,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1098,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Domain"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createDomainsRef(values?: $Shape<$Exact<DomainsRef>>): DomainsRef {
	return Object.assign(create(_TypeModel, DomainsRefTypeRef), values)
}

export type DomainsRef = {
	_type: TypeRef<DomainsRef>;

	_id: Id;

	items: Id;
}