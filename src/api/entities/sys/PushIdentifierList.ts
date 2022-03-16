import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "PushIdentifier",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPushIdentifierList(values?: Partial<PushIdentifierList>): PushIdentifierList {
	return Object.assign(create(_TypeModel, PushIdentifierListTypeRef), downcast<PushIdentifierList>(values))
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;

	_id: Id;

	list: Id;
}