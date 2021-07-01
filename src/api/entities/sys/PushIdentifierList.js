// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 636,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 637,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "PushIdentifier"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createPushIdentifierList(values?: $Shape<$Exact<PushIdentifierList>>): PushIdentifierList {
	return Object.assign(create(_TypeModel, PushIdentifierListTypeRef), values)
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;

	_id: Id;

	list: Id;
}