// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", "WhitelabelChildrenRef")
export const _TypeModel: TypeModel = {
	"name": "WhitelabelChildrenRef",
	"since": 26,
	"type": "AGGREGATED_TYPE",
	"id": 1269,
	"rootId": "A3N5cwAE9Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1270,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1271,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "WhitelabelChild"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createWhitelabelChildrenRef(values?: $Shape<$Exact<WhitelabelChildrenRef>>): WhitelabelChildrenRef {
	return Object.assign(create(_TypeModel, WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRef = {
	_type: TypeRef<WhitelabelChildrenRef>;

	_id: Id;

	items: Id;
}