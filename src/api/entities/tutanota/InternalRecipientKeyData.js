// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", "InternalRecipientKeyData")
export const _TypeModel: TypeModel = {
	"name": "InternalRecipientKeyData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 527,
	"rootId": "CHR1dGFub3RhAAIP",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 528, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"mailAddress": {
			"name": "mailAddress",
			"id": 529,
			"since": 11,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubEncBucketKey": {
			"name": "pubEncBucketKey",
			"id": 530,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubKeyVersion": {
			"name": "pubKeyVersion",
			"id": 531,
			"since": 11,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createInternalRecipientKeyData(values?: $Shape<$Exact<InternalRecipientKeyData>>): InternalRecipientKeyData {
	return Object.assign(create(_TypeModel, InternalRecipientKeyDataTypeRef), values)
}
