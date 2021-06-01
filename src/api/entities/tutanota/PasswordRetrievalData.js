// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const PasswordRetrievalDataTypeRef: TypeRef<PasswordRetrievalData> = new TypeRef("tutanota", "PasswordRetrievalData")
export const _TypeModel: TypeModel = {
	"name": "PasswordRetrievalData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 320,
	"rootId": "CHR1dGFub3RhAAFA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 321,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"id": 322,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createPasswordRetrievalData(values?: $Shape<$Exact<PasswordRetrievalData>>): PasswordRetrievalData {
	return Object.assign(create(_TypeModel, PasswordRetrievalDataTypeRef), values)
}

export type PasswordRetrievalData = {
	_type: TypeRef<PasswordRetrievalData>;

	_format: NumberString;
	autoAuthenticationId: Id;
}