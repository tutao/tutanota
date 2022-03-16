import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "RejectedSender",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createRejectedSendersRef(values?: Partial<RejectedSendersRef>): RejectedSendersRef {
	return Object.assign(create(_TypeModel, RejectedSendersRefTypeRef), downcast<RejectedSendersRef>(values))
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;

	_id: Id;

	items: Id;
}