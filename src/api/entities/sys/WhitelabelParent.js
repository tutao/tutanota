// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1273,
			"since": 26,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 1274,
			"since": 26,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"whitelabelChildInParent": {
			"name": "whitelabelChildInParent",
			"id": 1275,
			"since": 26,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "WhitelabelChild",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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