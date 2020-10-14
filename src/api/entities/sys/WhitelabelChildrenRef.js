// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1270,
			"since": 26,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1271,
			"since": 26,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "WhitelabelChild",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createWhitelabelChildrenRef(values?: $Shape<$Exact<WhitelabelChildrenRef>>): WhitelabelChildrenRef {
	return Object.assign(create(_TypeModel, WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRef = {
	_type: TypeRef<WhitelabelChildrenRef>;

	_id: Id;

	items: Id;
}