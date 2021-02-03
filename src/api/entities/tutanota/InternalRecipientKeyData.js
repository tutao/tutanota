// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 528,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 529,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubEncBucketKey": {
			"id": 530,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pubKeyVersion": {
			"id": 531,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createInternalRecipientKeyData(values?: $Shape<$Exact<InternalRecipientKeyData>>): InternalRecipientKeyData {
	return Object.assign(create(_TypeModel, InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyData = {
	_type: TypeRef<InternalRecipientKeyData>;

	_id: Id;
	mailAddress: string;
	pubEncBucketKey: Uint8Array;
	pubKeyVersion: NumberString;
}