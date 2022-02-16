import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", "DraftRecipient")
export const _TypeModel: TypeModel = {
	"name": "DraftRecipient",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 482,
	"rootId": "CHR1dGFub3RhAAHi",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 483,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 485,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 484,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createDraftRecipient(values?: Partial<DraftRecipient>): DraftRecipient {
	return Object.assign(create(_TypeModel, DraftRecipientTypeRef), downcast<DraftRecipient>(values))
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;

	_id: Id;
	mailAddress: string;
	name: string;
}