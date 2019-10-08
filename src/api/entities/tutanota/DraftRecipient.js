// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
		"_id": {"name": "_id", "id": 483, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"mailAddress": {
			"name": "mailAddress",
			"id": 485,
			"since": 11,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {"name": "name", "id": 484, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createDraftRecipient(values?: $Shape<$Exact<DraftRecipient>>): DraftRecipient {
	return Object.assign(create(_TypeModel, DraftRecipientTypeRef), values)
}
