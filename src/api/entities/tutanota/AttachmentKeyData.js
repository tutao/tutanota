// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", "AttachmentKeyData")
export const _TypeModel: TypeModel = {
	"name": "AttachmentKeyData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 542,
	"rootId": "CHR1dGFub3RhAAIe",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 543, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bucketEncFileSessionKey": {
			"name": "bucketEncFileSessionKey",
			"id": 544,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"fileSessionKey": {
			"name": "fileSessionKey",
			"id": 545,
			"since": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 546,
			"since": 11,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createAttachmentKeyData(values?: $Shape<$Exact<AttachmentKeyData>>): AttachmentKeyData {
	return Object.assign(create(_TypeModel, AttachmentKeyDataTypeRef), values)
}
