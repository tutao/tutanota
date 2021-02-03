// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 543,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncFileSessionKey": {
			"id": 544,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"fileSessionKey": {
			"id": 545,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"file": {
			"id": 546,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createAttachmentKeyData(values?: $Shape<$Exact<AttachmentKeyData>>): AttachmentKeyData {
	return Object.assign(create(_TypeModel, AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyData = {
	_type: TypeRef<AttachmentKeyData>;

	_id: Id;
	bucketEncFileSessionKey: ?Uint8Array;
	fileSessionKey: ?Uint8Array;

	file: IdTuple;
}