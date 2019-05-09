// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", "CreateMailGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateMailGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 708,
	"rootId": "CHR1dGFub3RhAALE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 709, "since": 19, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"encryptedName": {"name": "encryptedName", "id": 711, "since": 19, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"mailAddress": {"name": "mailAddress", "id": 710, "since": 19, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"mailEncMailboxSessionKey": {
			"name": "mailEncMailboxSessionKey",
			"id": 712,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupData": {
			"name": "groupData",
			"id": 713,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createCreateMailGroupData(): CreateMailGroupData {
	return create(_TypeModel, CreateMailGroupDataTypeRef)
}
