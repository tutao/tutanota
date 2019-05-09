// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UnencryptedStatisticLogEntryTypeRef: TypeRef<UnencryptedStatisticLogEntry> = new TypeRef("tutanota", "UnencryptedStatisticLogEntry")
export const _TypeModel: TypeModel = {
	"name": "UnencryptedStatisticLogEntry",
	"since": 25,
	"type": "LIST_ELEMENT_TYPE",
	"id": 880,
	"rootId": "CHR1dGFub3RhAANw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 884, "since": 25, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 882, "since": 25, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {"name": "_ownerGroup", "id": 885, "since": 25, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 883, "since": 25, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"contactFormPath": {"name": "contactFormPath", "id": 887, "since": 25, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"date": {"name": "date", "id": 886, "since": 25, "type": "Date", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createUnencryptedStatisticLogEntry(): UnencryptedStatisticLogEntry {
	return create(_TypeModel, UnencryptedStatisticLogEntryTypeRef)
}
