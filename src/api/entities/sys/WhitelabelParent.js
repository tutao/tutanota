// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", "WhitelabelParent")
export const _TypeModel: TypeModel = {
	"name": "WhitelabelParent",
	"since": 26,
	"type": "AGGREGATED_TYPE",
	"id": 1272,
	"rootId": "A3N5cwAE-A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1273,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"id": 1274,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer"
		},
		"whitelabelChildInParent": {
			"id": 1275,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "WhitelabelChild"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createWhitelabelParent(values?: $Shape<$Exact<WhitelabelParent>>): WhitelabelParent {
	return Object.assign(create(_TypeModel, WhitelabelParentTypeRef), values)
}

export type WhitelabelParent = {
	_type: TypeRef<WhitelabelParent>;

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}