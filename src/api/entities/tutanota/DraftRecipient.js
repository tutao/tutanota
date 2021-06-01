// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "46"
}

export function createDraftRecipient(values?: $Shape<$Exact<DraftRecipient>>): DraftRecipient {
	return Object.assign(create(_TypeModel, DraftRecipientTypeRef), values)
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;

	_id: Id;
	mailAddress: string;
	name: string;
}