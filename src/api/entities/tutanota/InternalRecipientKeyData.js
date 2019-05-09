// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", "InternalRecipientKeyData")
export const _TypeModel: TypeModel = {
	"name": "InternalRecipientKeyData",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 528,
	"rootId": "CHR1dGFub3RhAAIQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 529, "since": 11, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"mailAddress": {"name": "mailAddress", "id": 530, "since": 11, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"pubEncBucketKey": {"name": "pubEncBucketKey", "id": 531, "since": 11, "type": "Bytes", "cardinality": "One", "final": true, "encrypted": false},
		"pubKeyVersion": {"name": "pubKeyVersion", "id": 532, "since": 11, "type": "Number", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createInternalRecipientKeyData(): InternalRecipientKeyData {
	return create(_TypeModel, InternalRecipientKeyDataTypeRef)
}
