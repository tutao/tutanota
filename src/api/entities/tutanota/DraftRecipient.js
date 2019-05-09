// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", "DraftRecipient")
export const _TypeModel: TypeModel = {
	"name": "DraftRecipient",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 483,
	"rootId": "CHR1dGFub3RhAAHj",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 484, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"mailAddress": {"name": "mailAddress", "id": 486, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"name": {"name": "name", "id": 485, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createDraftRecipient(): DraftRecipient {
	return create(_TypeModel, DraftRecipientTypeRef)
}
