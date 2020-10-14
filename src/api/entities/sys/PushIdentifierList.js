// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", "PushIdentifierList")
export const _TypeModel: TypeModel = {
	"name": "PushIdentifierList",
	"since": 5,
	"type": "AGGREGATED_TYPE",
	"id": 635,
	"rootId": "A3N5cwACew",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 636,
			"since": 5,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"name": "list",
			"id": 637,
			"since": 5,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "PushIdentifier",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createPushIdentifierList(values?: $Shape<$Exact<PushIdentifierList>>): PushIdentifierList {
	return Object.assign(create(_TypeModel, PushIdentifierListTypeRef), values)
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;

	_id: Id;

	list: Id;
}