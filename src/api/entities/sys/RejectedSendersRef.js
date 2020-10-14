// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RejectedSendersRefTypeRef: TypeRef<RejectedSendersRef> = new TypeRef("sys", "RejectedSendersRef")
export const _TypeModel: TypeModel = {
	"name": "RejectedSendersRef",
	"since": 60,
	"type": "AGGREGATED_TYPE",
	"id": 1747,
	"rootId": "A3N5cwAG0w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1748,
			"since": 60,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1749,
			"since": 60,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "RejectedSender",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createRejectedSendersRef(values?: $Shape<$Exact<RejectedSendersRef>>): RejectedSendersRef {
	return Object.assign(create(_TypeModel, RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;

	_id: Id;

	items: Id;
}