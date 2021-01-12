// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1748,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1749,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "RejectedSender"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createRejectedSendersRef(values?: $Shape<$Exact<RejectedSendersRef>>): RejectedSendersRef {
	return Object.assign(create(_TypeModel, RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;

	_id: Id;

	items: Id;
}