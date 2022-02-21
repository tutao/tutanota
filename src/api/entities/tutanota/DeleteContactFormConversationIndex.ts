import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const DeleteContactFormConversationIndexTypeRef: TypeRef<DeleteContactFormConversationIndex> = new TypeRef("tutanota", "DeleteContactFormConversationIndex")
export const _TypeModel: TypeModel = {
	"name": "DeleteContactFormConversationIndex",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 838,
	"rootId": "CHR1dGFub3RhAANG",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 839,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 840,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "DeleteContactFormConversationIndexEntry"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createDeleteContactFormConversationIndex(values?: Partial<DeleteContactFormConversationIndex>): DeleteContactFormConversationIndex {
	return Object.assign(create(_TypeModel, DeleteContactFormConversationIndexTypeRef), downcast<DeleteContactFormConversationIndex>(values))
}

export type DeleteContactFormConversationIndex = {
	_type: TypeRef<DeleteContactFormConversationIndex>;

	_id: Id;

	items: Id;
}